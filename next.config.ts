import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Remotion's renderer and bundler external from Next.js bundling.
  // These packages have native dependencies (Chromium, platform-specific
  // compositor binaries) that should be loaded by Node at runtime, not
  // bundled by Turbopack/webpack.
  serverExternalPackages: [
    "@remotion/renderer",
    "@remotion/bundler",
  ],
  
  // Same for Turbopack (Next.js's faster dev bundler)
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;