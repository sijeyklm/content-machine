import Anthropic from "@anthropic-ai/sdk";
import { BrandRulesSchema, type BrandRules } from "@/lib/schemas";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a brand systems analyst. Your job is to read a brand book document and extract its structured rules into a strict JSON format.

You must follow these rules absolutely:

1. Return ONLY valid JSON. No prose before, no prose after, no markdown code fences.
2. The JSON must match the schema provided exactly. Missing required fields will cause the system to reject your response.
3. For colors, return exact 6-digit hex codes (like "#2B1810"). If the brand book uses color names without hex codes, infer the most likely hex from context, but prefer extracting explicit hex codes when present.
4. For typography, return font family names as written in the brand book. If multiple options or fallbacks are listed (like "Söhne Breit, fallback Inter"), return the primary name with the fallback in parentheses.
5. For voice attributes, extract 3-6 short phrases that describe the brand's tone. Each should be a brief noun phrase or short descriptor (like "confident, not arrogant" or "specific, not vague").
6. For banned_words, return only single words or short phrases that the brand book explicitly forbids. Do not include general "things we don't say" — only explicit banned terms.
7. If a field's information is not present in the brand book, omit optional fields entirely. Do not invent or hallucinate values for missing information.

Your output will be parsed programmatically and validated against a strict schema. Any deviation from the schema will cause an error.`;

const USER_PROMPT_TEMPLATE = (brandBookText: string) => `Extract the structured brand rules from this brand book. Return JSON matching this exact schema:

{
  "brand": {
    "name": "string",
    "tagline": "string (optional)",
    "mission": "string (optional)"
  },
  "colors": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB",
    "background": "#RRGGBB (optional)",
    "text": "#RRGGBB (optional)"
  },
  "typography": {
    "heading": "string",
    "body": "string",
    "display": "string (optional)"
  },
  "voice": {
    "attributes": ["string", "string", ...],
    "sample_phrases": ["string", ...],
    "avoid_phrases": ["string", ...],
    "banned_words": ["string", ...]
  },
  "channels": {
    "channel_name": {
      "notes": "string",
      "preferred_aspect_ratios": ["string"],
      "max_duration_seconds": number
    }
  }
}

BRAND BOOK TEXT:
---
${brandBookText}
---

Return only the JSON. Begin with { and end with }.`;

/**
 * Extract structured brand rules from raw brand book text using Claude.
 *
 * Includes one retry on schema validation failure with stricter instructions.
 * After two failures, throws — better to fail loudly than ship invalid data
 * to downstream components.
 */
export async function extractBrandRules(
  brandBookText: string
): Promise<BrandRules> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const userPrompt =
      attempt === 1
        ? USER_PROMPT_TEMPLATE(brandBookText)
        : `${USER_PROMPT_TEMPLATE(brandBookText)}\n\nYour previous response failed validation: ${lastError}\nReturn ONLY valid JSON matching the schema. Do not include explanations.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip any markdown code fences that may sneak in despite instructions
    const cleanedText = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleanedText);
      const validated = BrandRulesSchema.parse(parsed);
      return validated;
    } catch (err) {
      if (err instanceof Error) {
        lastError = err.message;
      }
      if (attempt === 2) {
        throw new Error(
          `Failed to extract valid brand rules after 2 attempts. Last error: ${lastError}`
        );
      }
    }
  }

  // Unreachable, but TypeScript needs it
  throw new Error("Unexpected state in extractBrandRules");
}