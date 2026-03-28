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
- "pantry": dry spices, seasonings, oils, vinegars, canned goods, flour, sugar, baking staples, soy sauce, hot sauce, dried pasta, breadcrumbs, dried beans — items with long shelf lives that a home cook is very likely to already have on hand.
- "buy": fresh produce, fresh meat, seafood, fresh dairy (milk, cream, fresh cheese like ricotta/mozzarella), fresh bread/bakery, fresh herbs — perishable items almost certainly needing purchase.
- "check": items that could go either way — butter, eggs, block/shredded cheeses, frozen items, specialty sauces, canned tomatoes, broth/stock, tortillas, heavy cream, sour cream.

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
