import { NextRequest, NextResponse } from "next/server";
import { renderVideo, type RenderVideoOptions } from "@/lib/render/video";
import fs from "fs/promises";

// Force Node.js runtime — Remotion's renderer requires filesystem access
// and Chromium, which aren't available in edge runtimes.
export const runtime = "nodejs";

// Allow this route to run for up to 5 minutes. Server-side video rendering
// takes 15-60 seconds depending on hardware; default Next.js timeout is 10s.
export const maxDuration = 300;

interface RenderRequestBody {
  compositionId?: string;
  props?: RenderVideoOptions["props"];
}

const VALID_COMPOSITION_IDS = [
  "AdSpot-9x16",
  "AdSpot-1x1",
  "AdSpot-4x5",
] as const;

type ValidCompositionId = (typeof VALID_COMPOSITION_IDS)[number];

const isValidCompositionId = (id: string): id is ValidCompositionId =>
  VALID_COMPOSITION_IDS.includes(id as ValidCompositionId);

/**
 * POST /api/render-video
 *
 * Body: { compositionId, props }
 * Returns: mp4 file as binary stream
 *
 * Renders the requested composition to mp4 using Remotion's server-side
 * renderer. Cleans up the temp file after streaming the response.
 */
export async function POST(request: NextRequest) {
  let outputPath: string | null = null;

  try {
    // Parse and validate the request body
    const body = (await request.json()) as RenderRequestBody;

    if (!body.compositionId || !isValidCompositionId(body.compositionId)) {
      return NextResponse.json(
        {
          error: "Invalid or missing compositionId",
          valid: VALID_COMPOSITION_IDS,
        },
        { status: 400 }
      );
    }

    if (!body.props) {
      return NextResponse.json(
        { error: "Missing props" },
        { status: 400 }
      );
    }

    // Validate props shape — minimal check, full validation happens via Zod
    // schema in production. For prototype, just check required fields exist.
    const requiredProps = [
      "hook",
      "bodyCopy",
      "cta",
      "productImageSrc",
      "colors",
    ] as const;
    for (const prop of requiredProps) {
      if (!(prop in body.props)) {
        return NextResponse.json(
          { error: `Missing required prop: ${prop}` },
          { status: 400 }
        );
      }
    }

    // Render
    const result = await renderVideo({
      compositionId: body.compositionId,
      props: body.props,
    });
    outputPath = result.outputPath;

    // Read the file and stream it back
    const fileBuffer = await fs.readFile(outputPath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${body.compositionId}.mp4"`,
        "Content-Length": String(result.bytes),
        "X-Render-Duration-Ms": String(result.durationMs),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Render failed",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  } finally {
    // Cleanup temp file even if response failed
    if (outputPath) {
      try {
        await fs.unlink(outputPath);
      } catch {
        // Best-effort cleanup; don't fail the response if cleanup fails
      }
    }
  }
}