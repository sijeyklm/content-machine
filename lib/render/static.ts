import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export interface StaticAdProps {
  hook: string;
  bodyCopy: string;
  cta: string;
  productImageSrc: string; // path relative to public/, like "/samples/product-shots/bottle.jpg"
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface StaticAdResult {
  buffer: Buffer;
  width: number;
  height: number;
  bytes: number;
  durationMs: number;
}

/**
 * Static ad layout presets. Each is a real performance-creative format.
 *   - meta-square: 1080x1080, the workhorse Meta feed format
 *   - google-display: 1200x628, the standard Google Display banner
 */
export type StaticAdSize = "meta-square" | "google-display";export type StaticAdVariant = "a" | "b";

const SIZE_DIMENSIONS: Record<
  StaticAdSize,
  { width: number; height: number; layout: "stacked" | "side-by-side" }
> = {
  "meta-square": { width: 1080, height: 1080, layout: "stacked" },
  "google-display": { width: 1200, height: 628, layout: "side-by-side" },
};

/**
 * HTML-escape a string for safe injection into SVG text nodes.
 * Without this, ampersands and angle brackets in copy break the SVG parser.
 */
const escapeSvg = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Wrap text into multiple lines based on approximate character width.
 * Sharp doesn't natively wrap text in SVG, so we pre-compute line breaks.
 */
const wrapText = (
  text: string,
  maxCharsPerLine: number
): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

/**
 * Generate the SVG overlay containing hook, body copy, and CTA.
 * The overlay sits on top of the product image; Sharp composites them.
 */
const buildOverlaySvg = (
  props: StaticAdProps,
  width: number,
  height: number,
  layout: "stacked" | "side-by-side",
  variant: StaticAdVariant
): string => {
  const { hook, bodyCopy, cta, colors } = props;

  if (layout === "stacked") {
  // Variant a: image on top, text on bottom (default)
  // Variant b: text on top, image on bottom (inverted)
  const textAreaY = variant === "b" ? 0 : height * 0.55;
  const textAreaHeight = height * 0.45;
    const padding = width * 0.06;

    const hookFontSize = Math.round(width * 0.055);
    const bodyFontSize = Math.round(width * 0.026);
    const ctaFontSize = Math.round(width * 0.026);

    const hookLines = wrapText(escapeSvg(hook), 28);
    const bodyLines = wrapText(escapeSvg(bodyCopy), 50);

    let yCursor = textAreaY + padding + hookFontSize;

    const hookText = hookLines
      .map((line, i) => {
        const y = yCursor + i * hookFontSize * 1.15;
        return `<text x="${padding}" y="${y}" font-family="Inter, sans-serif" font-weight="700" font-size="${hookFontSize}" fill="${colors.primary}" letter-spacing="-1">${line}</text>`;
      })
      .join("");

    yCursor += hookLines.length * hookFontSize * 1.15 + bodyFontSize * 1.4;

    const bodyText = bodyLines
      .map((line, i) => {
        const y = yCursor + i * bodyFontSize * 1.4;
        return `<text x="${padding}" y="${y}" font-family="Inter, sans-serif" font-weight="400" font-size="${bodyFontSize}" fill="${colors.primary}" opacity="0.85">${line}</text>`;
      })
      .join("");

    yCursor += bodyLines.length * bodyFontSize * 1.4 + ctaFontSize * 1.6;

    const ctaPaddingX = Math.round(ctaFontSize * 1.2);
    const ctaPaddingY = Math.round(ctaFontSize * 0.65);
    const ctaWidth = Math.min(escapeSvg(cta).length * ctaFontSize * 0.6 + ctaPaddingX * 2, width - padding * 2);
    const ctaHeight = ctaFontSize + ctaPaddingY * 2;

    const ctaSvg = `
      <rect x="${padding}" y="${yCursor - ctaHeight + ctaPaddingY}" width="${ctaWidth}" height="${ctaHeight}" rx="8" fill="${colors.accent}" />
      <text x="${padding + ctaPaddingX}" y="${yCursor + ctaFontSize * 0.05}" font-family="Inter, sans-serif" font-weight="600" font-size="${ctaFontSize}" fill="${colors.secondary}">${escapeSvg(cta)}</text>
    `;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="${textAreaY}" width="${width}" height="${textAreaHeight}" fill="${colors.secondary}" />
        <rect x="0" y="${textAreaY - 30}" width="${width}" height="30" fill="url(#fade)" />
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="${colors.secondary}" stop-opacity="0" />
            <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="1" />
          </linearGradient>
        </defs>
        ${hookText}
        ${bodyText}
        ${ctaSvg}
      </svg>
    `;
  }

  // Variant a: image on left, text on right (default)
// Variant b: image on right, text on left (mirrored)
const textPanelX = variant === "b" ? 0 : width * 0.5;
const textPanelWidth = width * 0.5;
  const padding = width * 0.04;

  const hookFontSize = Math.round(width * 0.045);
  const bodyFontSize = Math.round(width * 0.022);
  const ctaFontSize = Math.round(width * 0.022);

  const hookLines = wrapText(escapeSvg(hook), 22);
  const bodyLines = wrapText(escapeSvg(bodyCopy), 45);

  let yCursor = padding + hookFontSize + height * 0.15;

  const hookText = hookLines
    .map((line, i) => {
      const y = yCursor + i * hookFontSize * 1.15;
      return `<text x="${textPanelX + padding}" y="${y}" font-family="Inter, sans-serif" font-weight="700" font-size="${hookFontSize}" fill="${colors.primary}" letter-spacing="-1">${line}</text>`;
    })
    .join("");

  yCursor += hookLines.length * hookFontSize * 1.15 + bodyFontSize * 1.6;

  const bodyText = bodyLines
    .map((line, i) => {
      const y = yCursor + i * bodyFontSize * 1.4;
      return `<text x="${textPanelX + padding}" y="${y}" font-family="Inter, sans-serif" font-weight="400" font-size="${bodyFontSize}" fill="${colors.primary}" opacity="0.85">${line}</text>`;
    })
    .join("");

  yCursor += bodyLines.length * bodyFontSize * 1.4 + ctaFontSize * 1.8;

  const ctaPaddingX = Math.round(ctaFontSize * 1.2);
  const ctaPaddingY = Math.round(ctaFontSize * 0.65);
  const ctaWidth = escapeSvg(cta).length * ctaFontSize * 0.6 + ctaPaddingX * 2;
  const ctaHeight = ctaFontSize + ctaPaddingY * 2;

  const ctaSvg = `
    <rect x="${textPanelX + padding}" y="${yCursor - ctaHeight + ctaPaddingY}" width="${ctaWidth}" height="${ctaHeight}" rx="8" fill="${colors.accent}" />
    <text x="${textPanelX + padding + ctaPaddingX}" y="${yCursor + ctaFontSize * 0.05}" font-family="Inter, sans-serif" font-weight="600" font-size="${ctaFontSize}" fill="${colors.secondary}">${escapeSvg(cta)}</text>
  `;

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${textPanelX}" y="0" width="${textPanelWidth}" height="${height}" fill="${colors.secondary}" />
      ${hookText}
      ${bodyText}
      ${ctaSvg}
    </svg>
  `;
};

/**
 * Render a static ad image given props and a size preset.
 * Returns the rendered PNG as a Buffer plus metadata.
 */
export const renderStaticAd = async (
  props: StaticAdProps,
  size: StaticAdSize = "meta-square",
  variant: StaticAdVariant = "a"
): Promise<StaticAdResult> => {
  const startTime = Date.now();
  const dims = SIZE_DIMENSIONS[size];

  // Parse the brand secondary color (hex) into RGB for Sharp's create API
  const hexToRgb = (hex: string) => {
    const cleaned = hex.replace("#", "");
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
      alpha: 1,
    };
  };

  // Load and resize the product image to fit its target area
  const imagePath = path.join(
    process.cwd(),
    "public",
    props.productImageSrc.replace(/^\//, "")
  );
  const imageBuffer = await fs.readFile(imagePath);

  let resizedImageBuffer: Buffer;
  let imageTop: number;
  let imageLeft: number;

  if (dims.layout === "stacked") {
  const imageAreaHeight = Math.round(dims.height * 0.55);
  resizedImageBuffer = await sharp(imageBuffer)
    .resize(dims.width, imageAreaHeight, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  // Variant a: image on top. Variant b: image on bottom.
  imageTop = variant === "b" ? dims.height - imageAreaHeight : 0;
  imageLeft = 0;
} else {
  const imageAreaWidth = Math.round(dims.width * 0.5);
  resizedImageBuffer = await sharp(imageBuffer)
    .resize(imageAreaWidth, dims.height, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  // Variant a: image on left. Variant b: image on right.
  imageTop = 0;
  imageLeft = variant === "b" ? dims.width - imageAreaWidth : 0;
}

  // Build the SVG overlay (text + CTA + cream backdrop where appropriate)
  const overlaySvg = buildOverlaySvg(props, dims.width, dims.height, dims.layout, variant);
  const overlayBuffer = Buffer.from(overlaySvg);

  // Single-pass composition: cream canvas as background, then product image,
  // then SVG overlay. This composes everything in one Sharp call instead of
  // chaining create+composite+composite which is unreliable.
  const finalBuffer = await sharp({
    create: {
      width: dims.width,
      height: dims.height,
      channels: 4,
      background: hexToRgb(props.colors.secondary),
    },
  })
    .composite([
      { input: resizedImageBuffer, top: imageTop, left: imageLeft },
      { input: overlayBuffer, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();

  return {
    buffer: finalBuffer,
    width: dims.width,
    height: dims.height,
    bytes: finalBuffer.length,
    durationMs: Date.now() - startTime,
  };
};