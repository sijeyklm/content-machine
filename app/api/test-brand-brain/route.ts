import { NextResponse } from "next/server";
import { parseBrandBookFromPath } from "@/lib/brand-brain/pdf-parse";
import { extractBrandRules } from "@/lib/brand-brain/extract-rules";

export async function GET() {
  try {
    // Stage 1: parse the PDF
    const parsed = await parseBrandBookFromPath(
      "public/samples/northbean-brand-book.pdf"
    );

    // Stage 2: extract structured rules with Claude
    const rules = await extractBrandRules(parsed.rawText);

    return NextResponse.json({
      success: true,
      pdfStats: {
        pageCount: parsed.pageCount,
        charCount: parsed.charCount,
      },
      rules,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}