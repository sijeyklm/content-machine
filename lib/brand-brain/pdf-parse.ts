import { extractText, getDocumentProxy } from "unpdf";
import fs from "fs/promises";
import path from "path";

export interface ParsedBrandBook {
  rawText: string;
  pageCount: number;
  charCount: number;
}

/**
 * Parse a brand book PDF and return its raw text content.
 * Used as the first stage of the brand brain pipeline.
 */
export async function parseBrandBookFromBuffer(
  buffer: Buffer
): Promise<ParsedBrandBook> {
  // unpdf expects a Uint8Array
  const uint8Array = new Uint8Array(buffer);

  const pdf = await getDocumentProxy(uint8Array);
  const { text, totalPages } = await extractText(pdf, {
    mergePages: true,
  });

  // mergePages: true returns text as a single string (not array)
  const rawText = text;

  return {
    rawText: rawText.trim(),
    pageCount: totalPages,
    charCount: rawText.length,
  };
}

/**
 * Convenience helper: parse a brand book PDF directly from a file path.
 * Used by the test endpoint and during development.
 */
export async function parseBrandBookFromPath(
  filePath: string
): Promise<ParsedBrandBook> {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const buffer = await fs.readFile(absolutePath);
  return parseBrandBookFromBuffer(buffer);
}