import { GoogleGenerativeAI } from "@google/generative-ai";

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required to run scans.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ googleSearch: {} }],
  });
}

function today() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function extractText(result) {
  return result?.response?.text?.() || "";
}

export function parseJsonResponse(text) {
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    error.rawResponse = text;
    throw error;
  }
}

export async function runDiscovery() {
  const model = getModel();
  const prompt = `Today is ${today()}.

Search Google for what is currently happening in the fashion and beauty
dupe economy. Answer these questions using real search results:

1. Which fashion, beauty, skincare, or haircare products have gone viral
   in the past 2-4 weeks? Look for sudden search volume spikes, sold-out
   alerts, widespread social media coverage, and press coverage calling
   something the next it-product.

2. What products are consumers actively seeking cheaper alternatives to
   right now? What dupe-seeking behavior is visible in search trends,
   Reddit discussions, and TikTok content this week?

3. What new products launched on Amazon, TikTok Shop, or other mass
   market retailers this week that are explicitly or implicitly positioned
   as alternatives to higher-priced prestige products?

4. What are the most active dupe discussions happening right now on Reddit,
   TikTok, and beauty forums? What specific products are being compared?

Return ONLY valid JSON with no markdown formatting:
{
  "viral_products": [
    {
      "name": "product name",
      "brand": "brand name",
      "category": "fashion|makeup|skincare|haircare",
      "why_viral": "one sentence",
      "viral_platform": "TikTok|Reddit|Instagram|Press|Celebrity|Multiple",
      "approximate_viral_date": "Month Year or approximate",
      "known_dupes": [
        {
          "dupe_product": "name",
          "dupe_brand": "brand",
          "price_original": 0,
          "price_dupe": 0,
          "where_sold": "platform or retailer"
        }
      ]
    }
  ],
  "trending_dupe_searches": [
    "search term or product comparison people are searching for"
  ]
}`;

  const result = await model.generateContent(prompt);
  const raw = extractText(result);
  return { raw, data: parseJsonResponse(raw) };
}

export async function runDepth() {
  const model = getModel();
  const prompt = `Today is ${today()}.

Search for recent developments (past 2-4 weeks) in the fashion and
beauty dupe economy. Answer these questions:

1. Have any fashion or beauty brands publicly responded to dupe culture
   recently? Look for brand campaigns, legal actions, public statements,
   or product launches framed as responses to cheaper alternatives.

2. Have any fashion or beauty brands been acquired, received significant
   investment, or had notable valuation news recently? Include context
   on whether dupe proliferation appears related.

3. Which previously viral products appear to be declining in dupe
   interest - products that were heavily duped 6-12 months ago but are
   now seeing reduced search interest or dupe availability?

4. Which mass market or affordable brands have launched new products
   recently that closely mirror products which went viral at a higher
   price point? For each, identify: which affordable brand launched
   what product, which prestige product it appears to mirror, and how
   long after the prestige product went viral this launch happened.

5. Have any dupe products themselves gone viral - where the affordable
   alternative became more searched or discussed than the original?

Return ONLY valid JSON with no markdown formatting:
{
  "findings": [
    {
      "brand": "brand involved",
      "product": "specific product or null",
      "type": "brand_response|acquisition|declining_trend|dupe_went_viral|price_change",
      "headline": "one sentence factual description",
      "significance": "why this matters for understanding the dupe economy",
      "source": "publication or platform"
    }
  ],
  "mass_market_responses": [
    {
      "responding_brand": "the affordable brand",
      "launched_product": "what they launched",
      "appears_to_mirror": "the prestige product it resembles",
      "prestige_brand": "the prestige brand",
      "category": "fashion|makeup|skincare|haircare",
      "estimated_lag_months": 0,
      "significance": "what this reveals about where the trend is heading"
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const raw = extractText(result);
  return { raw, data: parseJsonResponse(raw) };
}
