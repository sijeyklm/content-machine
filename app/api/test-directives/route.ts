import { NextResponse } from "next/server";
import { parseBrandBookFromPath } from "@/lib/brand-brain/pdf-parse";
import { extractBrandRules } from "@/lib/brand-brain/extract-rules";
import { generateDirectives } from "@/lib/brand-brain/directives";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  const startTime = Date.now();
  const stages: Record<string, { ms: number; ok: boolean }> = {};

  try {
    // Stage 1: parse the brand book PDF
    const t1 = Date.now();
    const parsed = await parseBrandBookFromPath(
      "public/samples/northbean-brand-book.pdf"
    );
    stages.pdf_parse = { ms: Date.now() - t1, ok: true };

    // Stage 2: extract structured brand rules
    const t2 = Date.now();
    const rules = await extractBrandRules(parsed.rawText);
    stages.rule_extraction = { ms: Date.now() - t2, ok: true };

    // Stage 3: load the campaign brief
    const briefPath = path.join(
      process.cwd(),
      "public/samples/sample-brief.json"
    );
    const brief = JSON.parse(await fs.readFile(briefPath, "utf-8"));

    // Stage 4: generate directives (retrieval happens inside)
    const t3 = Date.now();
    const directives = await generateDirectives({
      brief: {
        campaign_name: brief.campaign_name,
        objective: brief.objective,
        key_message: brief.key_message,
        target_audience: brief.target_audience,
        must_include: brief.must_include,
        must_avoid: brief.must_avoid,
        channels: brief.channels,
        constraints: brief.constraints,
      },
      rules,
    });
    stages.directive_generation = { ms: Date.now() - t3, ok: true };

    return NextResponse.json({
      success: true,
      total_ms: Date.now() - startTime,
      stages,
      directives,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        total_ms: Date.now() - startTime,
        stages,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}