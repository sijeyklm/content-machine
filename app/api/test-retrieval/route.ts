import { NextResponse } from "next/server";
import { retrieveSimilar, filters } from "@/lib/brand-brain/retrieve";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // Load the sample brief to use as the query
    const briefPath = path.join(
      process.cwd(),
      "public/samples/sample-brief.json"
    );
    const brief = JSON.parse(await fs.readFile(briefPath, "utf-8"));

    // Construct a query from the brief's relevant fields
    const queryText = [
      brief.objective,
      brief.key_message,
      `Audience: ${brief.target_audience}`,
    ].join(" ");

    // Three retrievals to demonstrate the system's flexibility
    const unfiltered = await retrieveSimilar(queryText, 3);
const topPerformersOnly = await retrieveSimilar(queryText, 3, filters.topPerformersOnly);
const tiktokOnly = await retrieveSimilar(queryText, 3, filters.byPlatform("tiktok"));

    return NextResponse.json({
      success: true,
      query: queryText,
      results: {
        unfiltered: unfiltered.map((r) => ({
          id: r.ad.id,
          hook: r.ad.hook,
          platform: r.ad.platform,
          performance_tier: r.ad.performance_tier,
          similarity: Number(r.similarity.toFixed(4)),
        })),
        top_performers_only: topPerformersOnly.map((r) => ({
          id: r.ad.id,
          hook: r.ad.hook,
          platform: r.ad.platform,
          similarity: Number(r.similarity.toFixed(4)),
        })),
        tiktok_only: tiktokOnly.map((r) => ({
          id: r.ad.id,
          hook: r.ad.hook,
          platform: r.ad.platform,
          similarity: Number(r.similarity.toFixed(4)),
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}