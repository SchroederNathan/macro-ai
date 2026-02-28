import { streamText, UIMessage, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import {
  type USDASearchResponse,
  type USDAFoodFull,
} from '@/types/nutrition';

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;

/**
 * Search Perplexity Sonar for nutrition info — used as a smarter fallback
 * when USDA doesn't have a good match (branded foods, restaurant items, etc.)
 */
async function searchPerplexityNutrition(foodQuery: string): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  servingDescription?: string;
} | null> {
  if (!PERPLEXITY_API_KEY) return null;

  try {
    console.log('[PERPLEXITY] Searching for:', foodQuery);
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a nutrition data lookup tool. Return ONLY valid JSON with no other text. Search for accurate nutrition information for the requested food.',
          },
          {
            role: 'user',
            content: `What are the nutrition facts for one serving of "${foodQuery}"? If this is a restaurant or branded item, use the actual published nutrition data. Return ONLY this JSON format, no other text:\n{"calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"sugar":0,"servingDescription":"1 medium"}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      console.log('[PERPLEXITY] API error:', res.status);
      return null;
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.log('[PERPLEXITY] Could not parse JSON from:', content);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const result = {
      calories: Math.round(Number(parsed.calories) || 0),
      protein: Math.round((Number(parsed.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(parsed.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(parsed.fat) || 0) * 10) / 10,
      fiber: Math.round((Number(parsed.fiber) || 0) * 10) / 10,
      sugar: Math.round((Number(parsed.sugar) || 0) * 10) / 10,
      servingDescription: parsed.servingDescription,
    };

    // Sanity check — if everything is 0, it's not useful
    if (result.calories === 0 && result.protein === 0 && result.carbs === 0) {
      console.log('[PERPLEXITY] All zeros, discarding');
      return null;
    }

    console.log('[PERPLEXITY] Result:', result);
    return result;
  } catch (error) {
    console.error('[PERPLEXITY] Error:', error);
    return null;
  }
}

/**
 * Enhance query for better USDA search results
 * Adds "raw" suffix for whole foods that benefit from it
 */
function enhanceQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');

  // Skip if already has preparation method
  if (/\b(raw|cooked|fried|baked|grilled|roasted|steamed|boiled)\b/i.test(normalized)) {
    return normalized;
  }

  // Whole foods that benefit from "raw" suffix
  const rawFoods = /\b(banana|apple|orange|grape|strawberry|blueberry|mango|peach|pear|plum|cherry|avocado|tomato|carrot|celery|cucumber|spinach|lettuce|broccoli|pepper|onion|chicken|beef|pork|salmon|tuna|egg)\b/i;

  if (rawFoods.test(normalized)) {
    return `${normalized} raw`;
  }

  return normalized;
}


export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  console.log('[CHAT API] Received', messages.length, 'messages');

  const result = streamText({
    model: "google/gemini-3-flash",
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      // Single tool that searches, gets details, and returns ready-to-log data
      lookup_and_log_food: {
        description: 'Look up a food in the USDA database and log it. Use this when the user says they ate something. If the food is not found in USDA, provide your best estimate for the macros.',
        inputSchema: z.object({
          foodQuery: z.string().describe('The food to search for (e.g., "banana", "grilled chicken breast")'),
          displayName: z.string().describe('A friendly, human-readable name for the food (e.g., "Banana", "Grilled Chicken Breast", "Greek Yogurt")'),
          quantity: z.number().default(1).describe('Number of servings (default 1)'),
          meal: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional().describe('Meal type if mentioned'),
          // LLM-provided estimates used as fallback when USDA lookup fails
          estimatedCalories: z.number().optional().describe('Your estimated calories per serving if USDA lookup fails'),
          estimatedProtein: z.number().optional().describe('Your estimated protein (g) per serving if USDA lookup fails'),
          estimatedCarbs: z.number().optional().describe('Your estimated carbs (g) per serving if USDA lookup fails'),
          estimatedFat: z.number().optional().describe('Your estimated fat (g) per serving if USDA lookup fails'),
          estimatedFiber: z.number().optional().describe('Your estimated fiber (g) per serving if USDA lookup fails'),
          estimatedSugar: z.number().optional().describe('Your estimated sugar (g) per serving if USDA lookup fails'),
        }),
        execute: async ({ foodQuery, displayName, quantity = 1, meal, estimatedCalories, estimatedProtein, estimatedCarbs, estimatedFat, estimatedFiber, estimatedSugar }) => {
          console.log('[LOOKUP] Searching for:', foodQuery);

          // LLM-provided fallback macros (per serving) — last resort after Perplexity
          const hasLLMEstimate = estimatedCalories !== undefined || estimatedProtein !== undefined;
          const llmFallback = hasLLMEstimate ? {
            calories: Math.round(estimatedCalories ?? 100),
            protein: Math.round((estimatedProtein ?? 5) * 10) / 10,
            carbs: Math.round((estimatedCarbs ?? 15) * 10) / 10,
            fat: Math.round((estimatedFat ?? 3) * 10) / 10,
            fiber: Math.round((estimatedFiber ?? 0) * 10) / 10,
            sugar: Math.round((estimatedSugar ?? 0) * 10) / 10,
          } : null;

          // Helper: build a successful entry from any nutrient source
          const buildEntry = (nutrients: { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number }, source: 'usda' | 'perplexity' | 'estimate', servingDesc?: string) => ({
            success: true,
            entry: {
              name: displayName,
              quantity,
              serving: { amount: 1, unit: servingDesc || 'serving', gramWeight: 100 },
              nutrients,
              meal,
            },
            estimated: source !== 'usda',
            source,
            message: `Logged ${quantity} ${displayName} (${source === 'usda' ? '' : source + ': '}${nutrients.calories} cal)`,
          });

          // Helper: try Perplexity, then LLM estimate, then return null
          const tryFallbacks = async () => {
            const pplx = await searchPerplexityNutrition(foodQuery);
            if (pplx) {
              console.log('[LOOKUP] Source: Perplexity |', displayName, pplx.calories, 'cal');
              return buildEntry(pplx, 'perplexity', pplx.servingDescription);
            }
            if (llmFallback) {
              console.log('[LOOKUP] Source: LLM estimate |', displayName, llmFallback.calories, 'cal');
              return buildEntry(llmFallback, 'estimate');
            }
            return null;
          };

          if (!USDA_API_KEY) {
            console.log('[LOOKUP] No USDA API key, trying fallbacks');
            const fallback = await tryFallbacks();
            if (fallback) return fallback;
            return {
              success: false,
              error: 'No API keys configured. Please provide estimated macros.',
              message: 'Could not look up food. Please provide your best estimate for calories, protein, carbs, and fat.',
            };
          }

          try {
            // Enhance query for better results
            const enhancedQuery = enhanceQuery(foodQuery);

            // Search USDA - include Survey (FNDDS) for prepared/mixed foods
            console.log('[LOOKUP] Searching USDA:', enhancedQuery);
            const searchParams = new URLSearchParams({
              api_key: USDA_API_KEY,
              query: enhancedQuery,
              pageSize: '5',
              dataType: 'Survey (FNDDS),Foundation,SR Legacy',
            });
            const searchRes = await fetch(`${USDA_BASE_URL}/foods/search?${searchParams}`);

            // Handle non-OK responses
            if (!searchRes.ok) {
              console.log('[LOOKUP] USDA search failed:', searchRes.status, searchRes.statusText);
              const fallback = await tryFallbacks();
              if (fallback) return fallback;
              throw new Error(`USDA API error: ${searchRes.status}`);
            }

            const searchData = await searchRes.json() as USDASearchResponse;

            // Log all results for debugging
            if (searchData.foods?.length) {
              console.log('[LOOKUP] Search results:');
              searchData.foods.slice(0, 5).forEach((f, i) => {
                console.log(`  ${i + 1}. [${f.dataType}] ${f.description} (score: ${f.score})`);
              });
            }

            if (!searchData.foods?.length) {
              console.log('[LOOKUP] No USDA results, trying fallbacks');
              const fallback = await tryFallbacks();
              if (fallback) return fallback;
              return {
                success: false,
                error: 'Food not found. Please provide estimated macros.',
                foodQuery,
                message: `Could not find "${foodQuery}". Please provide your best estimate for calories, protein, carbs, and fat.`,
              };
            }

            // Find the best matching result - prefer results that contain query words
            const queryWords = enhancedQuery.toLowerCase().split(' ').filter(w => w.length > 2);
            let bestMatch = searchData.foods[0];
            let bestMatchCount = 0;

            for (const food of searchData.foods) {
              const desc = food.description.toLowerCase();
              const matchCount = queryWords.filter(w => desc.includes(w)).length;

              if (matchCount > bestMatchCount) {
                bestMatch = food;
                bestMatchCount = matchCount;
              }
            }

            // If no query words match, USDA result is likely wrong — try Perplexity first
            if (bestMatchCount === 0) {
              console.log('[LOOKUP] No good USDA match, trying fallbacks');
              const fallback = await tryFallbacks();
              if (fallback) return fallback;
            }

            const fdcId = bestMatch.fdcId;
            console.log('[LOOKUP] Selected:', bestMatch.description, '(fdcId:', fdcId, ')');

            // Get full details from API
            const detailRes = await fetch(`${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`);

            if (!detailRes.ok) {
              console.log('[LOOKUP] USDA detail fetch failed:', detailRes.status, detailRes.statusText);
              const fallback = await tryFallbacks();
              if (fallback) return fallback;
              throw new Error(`USDA API error: ${detailRes.status}`);
            }

            const food = await detailRes.json() as USDAFoodFull;
            console.log('[LOOKUP] Fetched food:', food.description);

            // Extract macros - handle multiple nutrient ID formats
            const getNutrient = (ids: number[]) => {
              for (const id of ids) {
                const n = food.foodNutrients?.find((n: any) =>
                  n.nutrientId === id ||
                  n.nutrient?.id === id ||
                  n.nutrientNumber === String(id)
                );
                if (n) {
                  const val = n.value ?? (n as any).amount ?? 0;
                  if (val > 0) return val;
                }
              }
              return 0;
            };

            // Energy IDs: 1008 (standard), 208 (alternate), 2047 (Atwater General), 2048 (Atwater Specific)
            const rawCalories = getNutrient([1008, 208, 2047, 2048]);
            const rawProtein = getNutrient([1003, 203]);
            const rawCarbs = getNutrient([1005, 205]);
            const rawFat = getNutrient([1004, 204]);

            // Calculate calories from macros if not found (protein*4 + carbs*4 + fat*9)
            const calculatedCalories = Math.round((rawProtein * 4) + (rawCarbs * 4) + (rawFat * 9));
            const calories = rawCalories > 0 ? Math.round(rawCalories) : calculatedCalories;

            const macros = {
              calories,
              protein: Math.round(rawProtein * 10) / 10,
              carbs: Math.round(rawCarbs * 10) / 10,
              fat: Math.round(rawFat * 10) / 10,
              fiber: Math.round(getNutrient([1079, 291]) * 10) / 10,
              sugar: Math.round(getNutrient([2000, 1063, 269]) * 10) / 10,
            };

            // Validate: if all macros are 0, try fallbacks
            if (macros.calories === 0 && macros.protein === 0 && macros.carbs === 0 && macros.fat === 0) {
              console.log('[LOOKUP] No valid nutrients in USDA, trying fallbacks');
              const fallback = await tryFallbacks();
              if (fallback) return fallback;
              return {
                success: false,
                error: 'Nutrient data incomplete. Please provide estimated macros.',
                foodQuery,
                fdcId,
                message: `Found "${food.description}" but nutrient data is incomplete. Please provide your best estimate.`,
              };
            }

            console.log('[LOOKUP] Macros per 100g:', macros);

            // Get a reasonable serving size - prefer medium-sized portions
            let portion = food.foodPortions?.[0];

            if (food.foodPortions && food.foodPortions.length > 1) {
              const mediumPortion = food.foodPortions.find((p: any) =>
                p.modifier?.toLowerCase().includes('medium') ||
                p.portionDescription?.toLowerCase().includes('medium')
              );
              if (mediumPortion) {
                portion = mediumPortion;
              }
            }

            const serving = portion
              ? {
                  amount: portion.amount || 1,
                  unit: portion.modifier || portion.portionDescription || 'serving',
                  gramWeight: portion.gramWeight || 100,
                }
              : { amount: 100, unit: 'g', gramWeight: 100 };

            // Scale macros to serving size
            const scale = serving.gramWeight / 100;
            const nutrients = {
              calories: Math.round(macros.calories * scale),
              protein: Math.round(macros.protein * scale * 10) / 10,
              carbs: Math.round(macros.carbs * scale * 10) / 10,
              fat: Math.round(macros.fat * scale * 10) / 10,
              fiber: Math.round(macros.fiber * scale * 10) / 10,
              sugar: Math.round(macros.sugar * scale * 10) / 10,
            };

            console.log('[LOOKUP] Source: USDA |', displayName, nutrients.calories, 'cal per', serving.unit);

            return {
              success: true,
              entry: {
                name: displayName,
                quantity,
                serving,
                nutrients,
                meal,
                fdcId,
              },
              estimated: false,
              source: 'usda',
              message: `Logged ${quantity} ${serving.unit} ${displayName} - ${nutrients.calories * quantity} cal, ${nutrients.protein * quantity}g protein`,
            };
          } catch (error) {
            console.error('[LOOKUP] Error:', error);
            const fallback = await tryFallbacks();
            if (fallback) return fallback;
            return {
              success: false,
              error: 'API error occurred. Please provide estimated macros.',
              foodQuery,
              message: `Error looking up "${foodQuery}". Please provide your best estimate for calories, protein, carbs, and fat.`,
            };
          }
        },
      },
    },
    system: `You are Miro, a friendly macro-tracking assistant.

When a user says they ate something (like "I had a banana" or "ate chicken for lunch"):
1. Use the lookup_and_log_food tool with the food name
2. Provide a friendly displayName - a clean, human-readable name like "Banana", "Grilled Chicken Breast", "Greek Yogurt" (NOT technical names like "Bananas, raw" or "Chicken, broilers or fryers, breast")
3. ALWAYS provide your best estimated macros (estimatedCalories, estimatedProtein, estimatedCarbs, estimatedFat, estimatedFiber, estimatedSugar) as backup in case the USDA lookup fails
4. After the tool returns successfully, ask the user to confirm: "Does this look right?" or "Sound good?" or similar short confirmation question

IMPORTANT - Adding more food to the draft:
- When a user says "with X", "and X", "also had X", or "add X" - ONLY call the tool for the NEW item X
- The previous items are already in the confirmation card from earlier tool calls - do NOT look them up again
- Example: You looked up "turkey sandwich", user says "and a big mac" → ONLY call tool for "big mac" (turkey sandwich is already in the card)

CORRECTIONS:
- If they say "actually it was X" or "no, I meant X" - they want to REPLACE. Call the tool for the new item only.
- "remove the X" or "delete X" → Tell them to tap the X button on that item to remove it
- "2 servings" or quantity changes → Call the tool again with the updated quantity

Your estimates should be reasonable per-serving values. For example:
- Medium banana: ~105 cal, 1g protein, 27g carbs, 0.4g fat, 3g fiber, 14g sugar
- Chicken breast (4oz): ~185 cal, 35g protein, 0g carbs, 4g fat, 0g fiber, 0g sugar
- Cup of rice: ~205 cal, 4g protein, 45g carbs, 0.4g fat, 0.6g fiber, 0g sugar
- Apple: ~95 cal, 0.5g protein, 25g carbs, 0.3g fat, 4g fiber, 19g sugar

Keep responses short and friendly. After the tool lookup, just ask for confirmation - don't repeat all the macros since they'll see them in the confirmation card.
Example: "Found it! Does this look right?"

If the user asks about their progress or totals, just say you've logged what they mentioned and they can check the home screen.`,
  });

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'none',
    },
  });
}
