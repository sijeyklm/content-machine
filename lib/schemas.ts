import { z } from "zod";

/**
 * The structured representation of a brand book.
 * This is the contract between the brand brain and the rest of the system.
 *
 * Every downstream component (directive generation, video render, static
 * composition) reads from this shape — never from raw PDF text.
 */
export const BrandRulesSchema = z.object({
  brand: z.object({
    name: z.string(),
    tagline: z.string().optional(),
    mission: z.string().optional(),
  }),

  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a 6-digit hex code"),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    background: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    text: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  }),

  typography: z.object({
    heading: z.string(),
    body: z.string(),
    display: z.string().optional(),
  }),

  voice: z.object({
    attributes: z.array(z.string()).min(1).max(8),
    sample_phrases: z.array(z.string()).max(8),
    avoid_phrases: z.array(z.string()).max(8),
    banned_words: z.array(z.string()).max(20),
  }),

  channels: z
    .record(
      z.string(),
      z.object({
        notes: z.string(),
        preferred_aspect_ratios: z.array(z.string()).optional(),
        max_duration_seconds: z.number().optional(),
      })
    )
    .optional(),
});

export type BrandRules = z.infer<typeof BrandRulesSchema>;
/**
 * A single creative directive — the structured output that drives one
 * platform's worth of rendering. The kit (below) bundles these for a
 * full multi-channel campaign.
 */
export const CreativeDirectiveSchema = z.object({
  platform: z.enum(["meta", "tiktok", "youtube_shorts"]),

  hook: z
    .string()
    .min(10, "Hook must be substantive (10+ chars)")
    .max(80, "Hook must fit on screen (max 80 chars)"),

  body_copy: z
    .string()
    .min(20, "Body copy must be substantive (20+ chars)")
    .max(150, "Body copy must be concise (max 150 chars)"),

  cta: z
    .string()
    .min(3, "CTA must be present")
    .max(30, "CTA must fit in a button (max 30 chars)"),

  visual_concept: z
    .string()
    .min(30, "Visual concept must describe what the ad shows"),

  duration_seconds: z
    .number()
    .int()
    .min(5, "Min duration 5 seconds")
    .max(60, "Max duration 60 seconds"),

  voiceover_script: z.string().optional(),

  suggested_footage_ids: z.array(z.string()).optional(),

  reasoning: z.string().max(300).optional(),
});

export type CreativeDirective = z.infer<typeof CreativeDirectiveSchema>;

/**
 * The full output of the directive-generation step: 3 platform-specific
 * directives plus kit-level metadata.
 *
 * This is the contract between the brand brain and the rendering pipeline.
 * Every downstream renderer (video, static, captions) reads from this shape.
 */
export const KitDirectivesSchema = z.object({
  campaign_name: z.string(),

  directives: z
    .array(CreativeDirectiveSchema)
    .min(3, "Must produce at least 3 directives")
    .max(6, "Cap at 6 directives"),

  shared_messaging: z.object({
    primary_value_prop: z.string(),
    proof_points: z.array(z.string()).min(1).max(5),
    tone_summary: z.string(),
  }),

  retrieved_inspiration: z
    .array(
      z.object({
        ad_id: z.string(),
        relevance: z.string(),
      })
    )
    .optional(),
});

export type KitDirectives = z.infer<typeof KitDirectivesSchema>;