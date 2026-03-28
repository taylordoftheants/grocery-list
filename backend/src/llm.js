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
- "pantry": dry spices, herbs, salt, pepper, seasonings, cooking oils, vinegars, flour, sugar, baking staples (baking powder, baking soda, vanilla extract, cornstarch) — items that live in the pantry essentially indefinitely and a home cook almost certainly already has.
- "buy": fresh produce, fresh meat, seafood, fresh dairy (milk, cream, fresh cheeses like ricotta/mozzarella/cottage cheese), fresh bread/bakery, fresh herbs — perishable items almost certainly needing purchase.
- "check": everything else that doesn't clearly fit the above — canned goods, sauces, condiments, hot sauce, soy sauce, broth/stock, dried pasta, dried beans, breadcrumbs, butter, eggs, block/shredded cheeses, frozen items, tortillas, heavy cream, sour cream. These are things the user might or might not have depending on what they've cooked recently.

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
