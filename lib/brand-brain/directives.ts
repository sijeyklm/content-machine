import Anthropic from "@anthropic-ai/sdk";
import {
  KitDirectivesSchema,
  type KitDirectives,
  type BrandRules,
} from "@/lib/schemas";
import { retrieveSimilar, type PastAd } from "./retrieve";

const client = new Anthropic();

export interface DirectiveGenerationInput {
  brief: {
    campaign_name: string;
    objective: string;
    key_message: string;
    target_audience: string;
    must_include?: string[];
    must_avoid?: string[];
    channels: string[];
    constraints?: Record<string, unknown>;
  };
  rules: BrandRules;
}

const SYSTEM_PROMPT = `You are a senior performance creative strategist with deep expertise in DTC marketing across Meta, TikTok, and YouTube Shorts. You have shipped hundreds of high-performing ads and you know what actually moves conversion rates.

Your job is to read a campaign brief, the brand's rules, and past ads from the brand's library, then generate platform-specific creative directives that:
- Respect the brand voice exactly — including banned words and forbidden phrases
- Apply platform-native creative best practices for each channel
- Take inspiration from past top performers without copying them verbatim
- Use specificity over generality — concrete tasting notes, real numbers, named processes

You must follow these rules absolutely:

1. Return ONLY valid JSON. No prose before, no prose after, no markdown fences. Begin with { and end with }.
2. The JSON must match the schema provided exactly. Missing or extra fields will cause rejection.
3. Generate exactly one directive per channel listed in the brief. Do not skip channels. Do not invent extra channels.
4. Every hook must be under 80 characters. Every body copy under 150. Every CTA under 30. Stay strictly within these limits — they reflect real on-screen rendering constraints, not preferences.
5. Never use any word from the brand's banned_words list. Never use any phrase from avoid_phrases. This is non-negotiable.
6. Use the brand's voice attributes as your tone calibration. If the brand says "confident, not arrogant," your hooks should feel confident without overstating.
7. Reference past ad inspiration honestly. If you draw from a retrieved past ad, list its ID in retrieved_inspiration with a brief note on what you drew from it. If you don't draw from any, omit retrieved_inspiration.

Platform-specific creative principles:

META (Facebook/Instagram feed):
- Caption-first storytelling — assume sound off
- First 3 seconds must show product or process, not lifestyle
- Body copy carries the story; hooks set up the scroll-stop
- Square (1:1) and portrait (4:5) work best
- Native feel beats over-produced

TIKTOK:
- The hook is everything — first 2 seconds determine whether someone watches
- POV-style framing works ("POV: you finally found...") when it fits the brand voice
- Handheld, real, unpolished aesthetic
- Captions on screen always (most users watch sound off)
- Show, don't tell — process and transformation beat talking heads

YOUTUBE SHORTS:
- Slightly longer attention than TikTok — viewers will give 5-10 seconds before deciding
- Voiceover-led works well for premium brands; let the founder or product speak
- Process and origin storytelling outperforms direct sell
- Longer body copy is acceptable, but the hook still has to land in the first 3 seconds

The output schema you must produce:

{
  "campaign_name": "string (from brief)",
  "directives": [
    {
      "platform": "meta or tiktok or youtube_shorts",
      "hook": "string, 10 to 80 chars",
      "body_copy": "string, 20 to 150 chars",
      "cta": "string, 3 to 30 chars",
      "visual_concept": "string, 30+ chars, describes what the ad shows",
      "duration_seconds": "integer, 5 to 60",
      "voiceover_script": "string, optional, only if VO-led",
      "suggested_footage_ids": "array of strings, optional, only if drawing from retrieved ads",
      "reasoning": "string, max 300 chars, why this directive will work"
    }
  ],
  "shared_messaging": {
    "primary_value_prop": "string, one sentence summary of what this campaign sells",
    "proof_points": "array of 1 to 5 specific reasons to believe",
    "tone_summary": "string, how this campaign should feel, one sentence"
  },
  "retrieved_inspiration": "optional array of objects with ad_id and relevance fields, only if you actually drew from retrieved ads"
}

Your output will be parsed programmatically and validated against a strict schema. Any deviation will cause the system to reject your response.`;

const buildUserPrompt = (
  input: DirectiveGenerationInput,
  retrievedAds: PastAd[]
): string => {
  const { brief, rules } = input;

  const retrievedAdsBlock = retrievedAds
    .map(
      (ad, i) => `PAST AD ${i + 1} (id: ${ad.id})
Platform: ${ad.platform} | Performance tier: ${ad.performance_tier}
Hook: "${ad.hook}"
Body: "${ad.body_copy}"
CTA: "${ad.cta}"
Concept: ${ad.concept}
Why retrieved: ${ad.retrieval_text}
Performance: CTR ${ad.performance.ctr_pct}%, ROAS ${ad.performance.roas}x`
    )
    .join("\n\n");

  return `Generate platform-specific creative directives for the following brief.

CAMPAIGN BRIEF:
Name: ${brief.campaign_name}
Objective: ${brief.objective}
Key message: ${brief.key_message}
Target audience: ${brief.target_audience}
Channels: ${brief.channels.join(", ")}
${brief.must_include?.length ? `Must include: ${brief.must_include.join(" / ")}` : ""}
${brief.must_avoid?.length ? `Must avoid: ${brief.must_avoid.join(" / ")}` : ""}

BRAND RULES:
Brand: ${rules.brand.name}
${rules.brand.tagline ? `Tagline: ${rules.brand.tagline}` : ""}
${rules.brand.mission ? `Mission: ${rules.brand.mission}` : ""}

Voice attributes: ${rules.voice.attributes.join(", ")}

Brand sample phrases (study these for tone):
${rules.voice.sample_phrases.map((p) => `- "${p}"`).join("\n")}

NEVER use these phrases:
${rules.voice.avoid_phrases.map((p) => `- "${p}"`).join("\n")}

NEVER use these words:
${rules.voice.banned_words.join(", ")}

Brand colors (for visual concept descriptions):
- Primary: ${rules.colors.primary}
- Secondary: ${rules.colors.secondary}
- Accent: ${rules.colors.accent}

PAST ADS FROM THIS BRAND (most relevant to this brief):
${retrievedAdsBlock}

---

Now generate the directives. Return only the JSON. Begin with { and end with }.`;
};

export async function generateDirectives(
  input: DirectiveGenerationInput
): Promise<KitDirectives> {
  const retrievalQuery = [
    input.brief.objective,
    input.brief.key_message,
    `Audience: ${input.brief.target_audience}`,
  ].join(" ");

  const retrievalResults = await retrieveSimilar(retrievalQuery, 3);
  const retrievedAds = retrievalResults.map((r) => r.ad);

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const userPrompt =
      attempt === 1
        ? buildUserPrompt(input, retrievedAds)
        : `${buildUserPrompt(input, retrievedAds)}\n\nYour previous response failed validation: ${lastError}\nReturn ONLY valid JSON matching the schema. Do not include explanations.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const cleaned = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      const validated = KitDirectivesSchema.parse(parsed);
      return validated;
    } catch (err) {
      if (err instanceof Error) {
        lastError = err.message;
      }
      if (attempt === 2) {
        throw new Error(
          `Failed to generate valid directives after 2 attempts. Last error: ${lastError}`
        );
      }
    }
  }

  throw new Error("Unexpected state in generateDirectives");
}