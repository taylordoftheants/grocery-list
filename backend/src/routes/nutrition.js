import express from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const FDC_BASE = 'https://api.nal.usda.gov/fdc/v1';
const FDC_API_KEY = process.env.USDA_FDC_API_KEY || 'DEMO_KEY';
const CACHE_DAYS = 30;

// Nutrient IDs used by USDA FoodData Central (values are per 100g)
const NID = { calories: 1008, protein: 1003, fat: 1004, carbs: 1005 };

// Common cooking units → grams
const UNIT_GRAMS = {
  cup: 240, cups: 240,
  tbsp: 15, tablespoon: 15, tablespoons: 15,
  tsp: 5, teaspoon: 5, teaspoons: 5,
  lb: 454, lbs: 454, pound: 454, pounds: 454,
  oz: 28, ounce: 28, ounces: 28,
  g: 1, gram: 1, grams: 1,
  kg: 1000, kilogram: 1000,
  clove: 4, cloves: 4,
  slice: 30, slices: 30,
  can: 400, cans: 400,
  pkg: 300, package: 300, packages: 300,
  head: 500, heads: 500,
  bunch: 150, bunches: 150,
  stalk: 40, stalks: 40,
};

function parseAmountToGrams(str) {
  if (!str || !str.trim()) return 100;
  const match = str.trim().match(/^(\d+(?:[./]\d+)?)\s*([a-zA-Z]*)/);
  if (!match) return 100;
  const numStr = match[1];
  let qty;
  if (numStr.includes('/')) {
    const [num, den] = numStr.split('/');
    qty = parseFloat(num) / parseFloat(den);
  } else {
    qty = parseFloat(numStr);
  }
  if (isNaN(qty) || qty <= 0) return 100;
  const unit = (match[2] || '').toLowerCase();
  const gramsPerUnit = UNIT_GRAMS[unit];
  return gramsPerUnit ? qty * gramsPerUnit : 100;
}

async function lookupNutrition(ingredientName) {
  const key = ingredientName.toLowerCase().trim();

  // Check cache (30-day TTL)
  const cached = db.prepare(
    `SELECT * FROM nutrition_cache WHERE ingredient_name = ? AND datetime(cached_at, '+${CACHE_DAYS} days') > datetime('now')`
  ).get(key);
  if (cached) {
    return { calories: cached.calories_per_100g, protein: cached.protein_per_100g, fat: cached.fat_per_100g, carbs: cached.carbs_per_100g };
  }

  try {
    const url = `${FDC_BASE}/foods/search?query=${encodeURIComponent(key)}&api_key=${encodeURIComponent(FDC_API_KEY)}&dataType=Foundation,SR%20Legacy&pageSize=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const food = data.foods?.[0];
    if (!food) return null;

    const map = {};
    for (const n of (food.foodNutrients || [])) {
      if (n.nutrientId === NID.calories) map.calories = n.value ?? 0;
      if (n.nutrientId === NID.protein)  map.protein  = n.value ?? 0;
      if (n.nutrientId === NID.fat)      map.fat      = n.value ?? 0;
      if (n.nutrientId === NID.carbs)    map.carbs    = n.value ?? 0;
    }

    const result = {
      calories: map.calories ?? 0,
      protein:  map.protein  ?? 0,
      fat:      map.fat      ?? 0,
      carbs:    map.carbs    ?? 0,
    };

    db.prepare(`
      INSERT OR REPLACE INTO nutrition_cache (ingredient_name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, cached_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(key, result.calories, result.protein, result.fat, result.carbs);

    return result;
  } catch (e) {
    console.error(`FDC lookup failed for "${key}":`, e.message);
    return null;
  }
}

// GET /api/nutrition/week?weekStart=YYYY-MM-DD
router.get('/week', authMiddleware, async (req, res) => {
  const { weekStart } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({ error: 'weekStart must be YYYY-MM-DD' });
  }

  const weekEnd = new Date(weekStart + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toLocaleDateString('en-CA');

  const entries = db.prepare(`
    SELECT * FROM meal_plan_entries
    WHERE user_id = ?
      AND is_leftovers = 0
      AND recipe_id IS NOT NULL
      AND (
        (is_weekly = 0 AND date BETWEEN ? AND ?) OR
        (is_weekly = 1 AND date = ?)
      )
  `).all(req.user.id, weekStart, weekEndStr, weekStart);

  if (entries.length === 0) {
    return res.json({ weeklyTotal: { calories: 0, protein: 0, fat: 0, carbs: 0 }, byEntry: [], isEstimate: true });
  }

  // Load unique recipes + their ingredients
  const recipeIds = [...new Set(entries.map(e => e.recipe_id))];
  const recipeMap = new Map();
  for (const rid of recipeIds) {
    const recipe = db.prepare('SELECT id, title FROM recipes WHERE id = ? AND user_id = ?').get(rid, req.user.id);
    if (!recipe) continue;
    const ingredients = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ?').all(rid);
    recipeMap.set(rid, { ...recipe, ingredients });
  }

  const byEntry = [];
  const weeklyTotal = { calories: 0, protein: 0, fat: 0, carbs: 0 };

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipe_id);
    if (!recipe) continue;

    // Determine which ingredients to count
    let selectedIds = new Set();
    if (entry.selected_optional_ids) {
      try {
        JSON.parse(entry.selected_optional_ids).forEach(id => selectedIds.add(id));
      } catch {}
    }
    const ingredients = recipe.ingredients.filter(ing =>
      !ing.is_optional || selectedIds.has(ing.id)
    );

    // Parallel FDC lookups
    const lookups = await Promise.all(
      ingredients.map(async (ing) => {
        const nutrition = await lookupNutrition(ing.name);
        if (!nutrition) return null;
        const factor = parseAmountToGrams(ing.amount) / 100;
        return {
          calories: nutrition.calories * factor,
          protein:  nutrition.protein  * factor,
          fat:      nutrition.fat      * factor,
          carbs:    nutrition.carbs    * factor,
        };
      })
    );

    const entryNutrition = { calories: 0, protein: 0, fat: 0, carbs: 0 };
    for (const n of lookups) {
      if (!n) continue;
      entryNutrition.calories += n.calories;
      entryNutrition.protein  += n.protein;
      entryNutrition.fat      += n.fat;
      entryNutrition.carbs    += n.carbs;
    }
    entryNutrition.calories = Math.round(entryNutrition.calories);
    entryNutrition.protein  = Math.round(entryNutrition.protein);
    entryNutrition.fat      = Math.round(entryNutrition.fat);
    entryNutrition.carbs    = Math.round(entryNutrition.carbs);

    byEntry.push({
      entryId:   entry.id,
      recipeId:  entry.recipe_id,
      label:     entry.label,
      date:      entry.date,
      is_weekly: entry.is_weekly,
      nutrition: entryNutrition,
    });

    weeklyTotal.calories += entryNutrition.calories;
    weeklyTotal.protein  += entryNutrition.protein;
    weeklyTotal.fat      += entryNutrition.fat;
    weeklyTotal.carbs    += entryNutrition.carbs;
  }

  res.json({ weeklyTotal, byEntry, isEstimate: true });
});

export default router;
