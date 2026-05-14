import { NextRequest, NextResponse } from "next/server";
import { renderStaticAd, type StaticAdProps, type StaticAdSize, type StaticAdVariant } from "@/lib/render/static";

export const runtime = "nodejs";

interface RenderStaticRequestBody {
  size?: StaticAdSize;
  variant?: StaticAdVariant;
  props?: StaticAdProps;
}

const VALID_SIZES: StaticAdSize[] = ["meta-square", "google-display"];

const isValidSize = (size: string): size is StaticAdSize =>
  VALID_SIZES.includes(size as StaticAdSize);

/**
 * POST /api/render-static
 *
 * Body: { size, props }
 * Returns: PNG file as binary stream
 *
 * Renders a static ad image using Sharp. Much faster than video rendering
 * (~100-500ms vs 9-15s) since there's no frame loop, no Chromium, no bundling.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RenderStaticRequestBody;

    if (!body.size || !isValidSize(body.size)) {
      return NextResponse.json(
        { error: "Invalid or missing size", valid: VALID_SIZES },
        { status: 400 }
      );
    }

    if (!body.props) {
      return NextResponse.json({ error: "Missing props" }, { status: 400 });
    }

    const requiredProps = ["hook", "bodyCopy", "cta", "productImageSrc", "colors"] as const;
    for (const prop of requiredProps) {
      if (!(prop in body.props)) {
        return NextResponse.json(
          { error: `Missing required prop: ${prop}` },
          { status: 400 }
        );
      }
    }

    const variant: StaticAdVariant = body.variant === "b" ? "b" : "a";
const result = await renderStaticAd(body.props, body.size, variant);

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${body.size}.png"`,
        "Content-Length": String(result.bytes),
        "X-Render-Duration-Ms": String(result.durationMs),
        "X-Render-Width": String(result.width),
        "X-Render-Height": String(result.height),
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
  }
}