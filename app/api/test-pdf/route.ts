import { NextResponse } from "next/server";
import { parseBrandBookFromPath } from "@/lib/brand-brain/pdf-parse";

export async function GET() {
  try {
    const result = await parseBrandBookFromPath(
      "public/samples/northbean-brand-book.pdf"
    );

    return NextResponse.json({
      success: true,
      pageCount: result.pageCount,
      charCount: result.charCount,
      preview: result.rawText.slice(0, 500),
      containsNorthbean: result.rawText.toLowerCase().includes("northbean"),
      containsHexCodes: /#[0-9A-Fa-f]{6}/.test(result.rawText),
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