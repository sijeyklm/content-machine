import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import path from "path";
import os from "os";
import fs from "fs/promises";

export interface RenderVideoOptions {
  compositionId: "AdSpot-9x16" | "AdSpot-1x1" | "AdSpot-4x5";
  props: {
    hook: string;
    bodyCopy: string;
    cta: string;
    productImageSrc: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

export interface RenderVideoResult {
  outputPath: string;
  durationMs: number;
  bytes: number;
}

/**
 * Cache the bundle promise so we only bundle once per server lifetime.
 * Bundling is expensive (~10-30s) but the result is reusable across renders.
 */
let bundlePromise: Promise<string> | null = null;

const getBundle = async (): Promise<string> => {
  if (!bundlePromise) {
    const entry = path.join(process.cwd(), "remotion", "index.ts");
    bundlePromise = bundle({
      entryPoint: entry,
      webpackOverride: (config) => config,
    });
  }
  return bundlePromise;
};

/**
 * Render a Remotion composition to an mp4 file.
 *
 * Returns the path to the rendered file in the OS temp directory,
 * the render duration, and the file size. Caller is responsible for
 * cleaning up the file when done.
 */
export const renderVideo = async (
  options: RenderVideoOptions
): Promise<RenderVideoResult> => {
  const startTime = Date.now();

  // Step 1: bundle Remotion compositions (cached)
  const bundleLocation = await getBundle();

  // Step 2: select the requested composition (resolves dimensions, fps, duration)
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: options.compositionId,
    inputProps: options.props,
  });

  // Step 3: define output path in OS temp directory
  const outputDir = path.join(os.tmpdir(), "content-machine-renders");
  await fs.mkdir(outputDir, { recursive: true });
  const outputFilename = `${options.compositionId}-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, outputFilename);

  // Step 4: render
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: options.props,
  });

  // Step 5: report stats
  const stats = await fs.stat(outputPath);
  return {
    outputPath,
    durationMs: Date.now() - startTime,
    bytes: stats.size,
  };
};