"use client";

import { useState } from "react";
import brandRules from "@/public/samples/cached/northbean-rules.json";

const VIDEO_OPTIONS = [
  { id: "AdSpot-9x16", label: "9:16 — TikTok / Shorts" },
  { id: "AdSpot-1x1", label: "1:1 — Meta Square" },
  { id: "AdSpot-4x5", label: "4:5 — Meta Portrait" },
] as const;

const STATIC_OPTIONS = [
  { size: "meta-square", variant: "a", label: "Meta Square — Variant A (image top)" },
  { size: "meta-square", variant: "b", label: "Meta Square — Variant B (image bottom)" },
  { size: "google-display", variant: "a", label: "Google Display — Variant A (image left)" },
  { size: "google-display", variant: "b", label: "Google Display — Variant B (image right)" },
] as const;

const SAMPLE_DIRECTIVE = {
  hook: "POV: you're trying three single-origins in three months",
  bodyCopy: "Ethiopian bergamot. Colombian caramel. Guatemalan citrus. 18-hour slow steep. Each one hits exactly right.",
  cta: "Link in bio",
};

const PRODUCT_IMAGE = "/samples/product-shots/bottle.jpg";

const SHARED_PROPS = {
  ...SAMPLE_DIRECTIVE,
  productImageSrc: PRODUCT_IMAGE,
  colors: {
    primary: brandRules.colors.primary,
    secondary: brandRules.colors.secondary,
    accent: brandRules.colors.accent,
  },
};

type RenderResult = {
  url: string;
  type: "video" | "static";
  label: string;
  durationMs: number;
  bytes: number;
};

type RenderState =
  | { status: "idle" }
  | { status: "rendering"; format: string; startedAt: number }
  | { status: "error"; message: string };

export default function RenderTestPage() {
  const [state, setState] = useState<RenderState>({ status: "idle" });
  const [results, setResults] = useState<RenderResult[]>([]);

  const renderVideo = async (compositionId: string, label: string) => {
    setState({ status: "rendering", format: label, startedAt: Date.now() });

    try {
      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId, props: SHARED_PROPS }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "HTTP " + response.status }));
        throw new Error(errorBody.error || "Render failed");
      }

      const durationMs = Number(response.headers.get("X-Render-Duration-Ms") || "0");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setResults((prev) => [
        { url, type: "video", label, durationMs, bytes: blob.size },
        ...prev,
      ]);
      setState({ status: "idle" });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const renderStatic = async (size: string, variant: string, label: string) => {
    setState({ status: "rendering", format: label, startedAt: Date.now() });

    try {
      const response = await fetch("/api/render-static", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size, variant, props: SHARED_PROPS }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "HTTP " + response.status }));
        throw new Error(errorBody.error || "Render failed");
      }

      const durationMs = Number(response.headers.get("X-Render-Duration-Ms") || "0");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      setResults((prev) => [
        { url, type: "static", label, durationMs, bytes: blob.size },
        ...prev,
      ]);
      setState({ status: "idle" });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const isRendering = state.status === "rendering";

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Render test</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Trigger video or static renders. Results stack below in render order.
      </p>

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Video</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {VIDEO_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => renderVideo(opt.id, opt.label)}
              disabled={isRendering}
              style={{
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: isRendering ? "#ddd" : "#2B1810",
                color: isRendering ? "#999" : "#fff",
                border: "none",
                borderRadius: 6,
                cursor: isRendering ? "wait" : "pointer",
                textAlign: "left",
              }}
            >
              Render video — {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Static</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STATIC_OPTIONS.map((opt) => (
  <button
    key={`${opt.size}-${opt.variant}`}
    onClick={() => renderStatic(opt.size, opt.variant, opt.label)}
              disabled={isRendering}
              style={{
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 500,
                backgroundColor: isRendering ? "#ddd" : "#B8714D",
                color: isRendering ? "#999" : "#fff",
                border: "none",
                borderRadius: 6,
                cursor: isRendering ? "wait" : "pointer",
                textAlign: "left",
              }}
            >
              Render static — {opt.label}
            </button>
          ))}
        </div>
      </section>

      {state.status === "rendering" ? (
        <div style={{ padding: 16, backgroundColor: "#FFF8E7", border: "1px solid #F4D9A8", borderRadius: 6, fontSize: 14, color: "#7A5410", marginBottom: 24 }}>
          Rendering {state.format}... ({Math.round((Date.now() - state.startedAt) / 1000)}s)
        </div>
      ) : null}

      {state.status === "error" ? (
        <div style={{ padding: 16, backgroundColor: "#FEE", border: "1px solid #F8B4B4", borderRadius: 6, fontSize: 14, color: "#9F1F1F", marginBottom: 24 }}>
          <strong>Error:</strong> {state.message}
        </div>
      ) : null}

      {results.length > 0 ? (
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 500, marginBottom: 16 }}>
            Renders ({results.length})
          </h2>
          {results.map((result, i) => (
            <div key={i} style={{ marginBottom: 32, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                <strong>{result.label}</strong> · {result.type} · {(result.durationMs / 1000).toFixed(1)}s · {(result.bytes / 1024).toFixed(0)} KB
              </div>
              {result.type === "video" ? (
                <video src={result.url} controls autoPlay loop muted style={{ width: "100%", borderRadius: 6, backgroundColor: "#000" }} />
              ) : (
                <img src={result.url} alt={result.label} style={{ width: "100%", borderRadius: 6 }} />
              )}
              <a              
                href={result.url}
                download={result.label.replace(/[^a-z0-9]/gi, "-").toLowerCase() + (result.type === "video" ? ".mp4" : ".png")}
                style={{
                  display: "inline-block",
                  marginTop: 12,
                  padding: "8px 16px",
                  backgroundColor: "#B8714D",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                Download
              </a>
            </div>
          ))}
        </section>
      ) : null}
    </main>
  );
}