import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Classify grocery items as 'pantry', 'buy', or 'check'.
 * Returns a map of { normalizedItemName: 'pantry' | 'buy' | 'check' }.
 * On any failure, returns an empty object (caller should default to 'buy').
 */
export async function classifyPantryItems(itemNames) {
  if (!itemNames || itemNames.length === 0) return {};
  if (!process.env.ANTHROPIC_API_KEY) return {};

  const list = itemNames.map(n => `- ${n}`).join('\n');
  const prompt = `You are a pantry assistant. Classify each grocery ingredient as one of:
- "pantry": ONLY dry spices, herbs, salt, pepper, seasonings, cooking oils, vinegars, flour, sugar, and baking staples (baking powder, baking soda, vanilla extract, cornstarch). These must be unbranded dry goods that live in the pantry indefinitely and a home cook almost certainly already has. Do NOT put branded products, refrigerated items, or anything perishable here.
- "buy": all meat and poultry (beef, chicken, pork, lamb), all plant-based meat alternatives (Impossible Burger, Impossible Meat, Beyond Burger, Beyond Meat, etc.), seafood, deli meats, bacon, sausage, fresh produce, fresh dairy (milk, cream, fresh cheeses like ricotta/mozzarella/cottage cheese), fresh bread/bakery, fresh herbs — perishable or refrigerated items the user almost certainly needs to buy.
- "check": everything else — canned goods (beans, tomatoes, tuna, etc.), sauces, condiments, hot sauce, soy sauce, broth/stock, dried pasta, dried beans, breadcrumbs, butter, eggs, block/shredded cheeses, frozen items, tortillas, heavy cream, sour cream, packaged snacks. These are things the user might or might not have.

IMPORTANT: When in doubt between "pantry" and another category, always prefer "check" or "buy". A false "pantry" label hides an item the user needs — that is the worst outcome.

Return ONLY valid JSON with no markdown fences and no explanation. Use the exact item name from the input as the key.
Format: { "item name": "pantry|buy|check", ... }

Items to classify:
${list}`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0]?.text?.trim() ?? '';
    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);

    // Validate and filter to only known values
    const result = {};
    for (const [key, val] of Object.entries(parsed)) {
      if (val === 'pantry' || val === 'buy' || val === 'check') {
        result[key] = val;
      }
    }
    return result;
  } catch (e) {
    console.error('LLM classification failed:', e.message);
    return {};
  }
}
