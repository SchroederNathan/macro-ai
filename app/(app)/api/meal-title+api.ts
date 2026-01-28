import { generateText } from 'ai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const foodNames = body?.foodNames as string[] | undefined;

    if (!foodNames || foodNames.length < 2) {
      return Response.json({ title: null });
    }

    console.log('[MEAL TITLE] Generating title for:', foodNames);

    const result = await generateText({
      model: 'google/gemini-3-flash',
      prompt: `Create a short, natural name for a meal containing: ${foodNames.join(', ')}.

Rules:
- 2-4 words maximum
- Be descriptive and accurate to what the foods actually are
- Sound like something you'd see on a menu or tell a friend
- Don't be overly creative or use made-up words
- Don't use generic terms like "combo", "meal", "plate", or "bowl" unless it fits

Good examples:
- Chicken + Rice + Broccoli → "Chicken Rice & Veggies"
- Eggs + Toast + Bacon → "Classic Breakfast"
- Protein Bar + Overnight Oats → "Protein Oats Duo"
- Salmon + Salad → "Salmon Salad"
- Burger + Fries → "Burger & Fries"

Return ONLY the meal name, nothing else.`,
    });

    const title = result.text?.trim() || null;
    console.log('[MEAL TITLE] Generated:', title);

    return Response.json({ title });
  } catch (error) {
    console.error('[MEAL TITLE] Error:', error);
    // Always return valid JSON even on error
    return Response.json({ title: null, error: String(error) });
  }
}
