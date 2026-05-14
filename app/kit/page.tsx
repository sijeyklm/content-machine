"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import brandRules from "@/public/samples/cached/northbean-rules.json";
import sampleDirectives from "@/public/samples/cached/sample-directives.json";
import styles from "../landing.module.css";

type VideoAspectRatio = "AdSpot-9x16" | "AdSpot-1x1" | "AdSpot-4x5";

interface RenderState {
  bytesKB?: number;
  status: "idle" | "rendering" | "ready" | "error";
  url?: string;
  error?: string;
  durationMs?: number;
}

const RATIO_LABELS: Record<VideoAspectRatio, string> = {
  "AdSpot-9x16": "9:16 — TikTok / Shorts",
  "AdSpot-1x1": "1:1 — Meta Square",
  "AdSpot-4x5": "4:5 — Meta Portrait",
};

interface StaticVariant {
  size: "meta-square" | "google-display";
  variant: "a" | "b";
  label: string;
}

const STATIC_VARIANTS: StaticVariant[] = [
  { size: "meta-square", variant: "a", label: "Meta Square — A (image top)" },
  { size: "meta-square", variant: "b", label: "Meta Square — B (image bottom)" },
  { size: "google-display", variant: "a", label: "Google Display — A (image left)" },
  { size: "google-display", variant: "b", label: "Google Display — B (image right)" },
];

const SAMPLE_DIRECTIVE = {
  hook: "POV: you're trying three single-origins in three months",
  bodyCopy: "Ethiopian bergamot. Colombian caramel. Guatemalan citrus. 18-hour slow steep. Each one hits exactly right.",
  cta: "Link in bio",
};

const SHARED_PROPS = {
  ...SAMPLE_DIRECTIVE,
  productImageSrc: "/samples/product-shots/bottle.jpg",
  colors: {
    primary: brandRules.colors.primary,
    secondary: brandRules.colors.secondary,
    accent: brandRules.colors.accent,
  },
};

const variantKey = (v: StaticVariant) => v.size + "-" + v.variant;

const formatJsonWithHighlighting = (obj: unknown): string => {
  return JSON.stringify(obj, null, 2);
};

export default function KitPage() {
  const [activeRatio, setActiveRatio] = useState<VideoAspectRatio>("AdSpot-9x16");
  const [videoStates, setVideoStates] = useState<Record<VideoAspectRatio, RenderState>>({
    "AdSpot-9x16": { status: "idle" },
    "AdSpot-1x1": { status: "idle" },
    "AdSpot-4x5": { status: "idle" },
  });

  const [staticStates, setStaticStates] = useState<Record<string, RenderState>>(() => {
    const initial: Record<string, RenderState> = {};
    STATIC_VARIANTS.forEach((v) => {
      initial[variantKey(v)] = { status: "idle" };
    });
    return initial;
  });

  const [directivesOpen, setDirectivesOpen] = useState(false);

  const activeState = videoStates[activeRatio];
  const isAnyVideoRendering = Object.values(videoStates).some((s) => s.status === "rendering");

  const renderVideo = async (ratio: VideoAspectRatio) => {
    setVideoStates((prev) => ({ ...prev, [ratio]: { status: "rendering" } }));
    try {
      const response = await fetch("/api/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compositionId: ratio, props: SHARED_PROPS }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "HTTP " + response.status }));
        throw new Error(errorBody.error || "Render failed");
      }
      const durationMs = Number(response.headers.get("X-Render-Duration-Ms") || "0");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideoStates((prev) => ({
        ...prev,
        [ratio]: { status: "ready", url, durationMs, bytesKB: Math.round(blob.size / 1024) },
      }));
    } catch (error) {
      setVideoStates((prev) => ({
        ...prev,
        [ratio]: { status: "error", error: error instanceof Error ? error.message : "Unknown error" },
      }));
    }
  };

  const renderStatic = async (v: StaticVariant) => {
    const key = variantKey(v);
    setStaticStates((prev) => ({ ...prev, [key]: { status: "rendering" } }));
    try {
      const response = await fetch("/api/render-static", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: v.size, variant: v.variant, props: SHARED_PROPS }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "HTTP " + response.status }));
        throw new Error(errorBody.error || "Render failed");
      }
      const durationMs = Number(response.headers.get("X-Render-Duration-Ms") || "0");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setStaticStates((prev) => ({
        ...prev,
        [key]: { status: "ready", url, durationMs, bytesKB: Math.round(blob.size / 1024) },
      }));
    } catch (error) {
      setStaticStates((prev) => ({
        ...prev,
        [key]: { status: "error", error: error instanceof Error ? error.message : "Unknown error" },
      }));
    }
  };

  useEffect(() => {
    STATIC_VARIANTS.forEach((v) => {
      renderStatic(v);
    });
  }, []);

  return (
    <div className={styles.page}>
      <section className={styles.heroSection}>
        <div className={styles.container}>
          <Link href="/" style={{ display: "block", marginBottom: 32, fontSize: 14, color: "#5C453B", textDecoration: "none" }}>
            ← Back to overview
          </Link>
          <div className={styles.eyebrow}>The rendered kit</div>
          <h1 className={styles.heroHeadline} style={{ fontSize: 40 }}>
            Seven channel-ready assets, generated from one brief.
          </h1>
          <p className={styles.heroSubhead}>
            Each format below is rendered live by the system. Click a ratio to render that
            video variant; statics render automatically on page load.
          </p>
        </div>
      </section>

      {process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? (
        <section className={styles.kitSection}>
          <div className={styles.container}>
            <div className={styles.productionBanner}>
              <span className={styles.productionBannerIcon}>ℹ️</span>
              <div className={styles.productionBannerContent}>
                <p className={styles.productionBannerTitle}>You&apos;re viewing a production preview</p>
                <p className={styles.productionBannerText}>
                  Video and static rendering are disabled here because they require Chrome&apos;s native
                  dependencies on the server. The demo video below shows the rendering system working
                  locally. To run all features yourself, clone the repo (link in README).
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.kitSection}>
        <div className={styles.container}>
          <h2 className={styles.kitSectionHeader}>Video formats</h2>
          <p className={styles.kitSectionLead}>
            Three aspect ratios from a single composition — same brand, same content, different canvas.
          </p>

          <div className={styles.ratioToggle}>
            {(Object.keys(RATIO_LABELS) as VideoAspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setActiveRatio(ratio)}
                disabled={isAnyVideoRendering}
                className={
                  ratio === activeRatio
                    ? styles.ratioButton + " " + styles.ratioButtonActive
                    : styles.ratioButton
                }
              >
                {RATIO_LABELS[ratio]}
              </button>
            ))}
          </div>

          <div className={styles.videoStage}>
            <div className={styles.videoStageInner}>
              {activeState.status === "idle" ? (
                <div className={styles.videoIdle}>
                  <p className={styles.videoIdleTitle}>Ready to render</p>
                  <p className={styles.videoIdleText}>
                    Each video takes 9-15 seconds to render server-side.
                  </p>
                  <button
                    onClick={() => renderVideo(activeRatio)}
                    disabled={isAnyVideoRendering}
                    className={styles.videoRenderButton}
                  >
                    Render {RATIO_LABELS[activeRatio]}
                  </button>
                </div>
              ) : null}

              {activeState.status === "rendering" ? (
                <div className={styles.videoRendering}>
                  <p className={styles.videoIdleTitle}>Rendering...</p>
                  <p className={styles.videoRenderingText}>
                    Server is bundling Remotion compositions and producing the mp4.
                  </p>
                </div>
              ) : null}

              {activeState.status === "ready" && activeState.url ? (
                <>
                  <video src={activeState.url} controls autoPlay loop muted />
                  <div className={styles.videoMeta}>
                    Rendered in {((activeState.durationMs || 0) / 1000).toFixed(1)}s
                    {activeState.bytesKB ? " · " + activeState.bytesKB + " KB" : ""}
                  </div>
                </>
              ) : null}

              {activeState.status === "error" ? (
                <div className={styles.videoIdle}>
                  <p className={styles.videoIdleTitle} style={{ color: "#9F1F1F" }}>Render failed</p>
                  <p className={styles.videoIdleText}>{activeState.error}</p>
                  <button
                    onClick={() => renderVideo(activeRatio)}
                    className={styles.videoRenderButton}
                  >
                    Try again
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.kitSection}>
        <div className={styles.container}>
          <h2 className={styles.kitSectionHeader}>Static formats</h2>
          <p className={styles.kitSectionLead}>
            Two sizes, two variants each. Sharp produces these in under half a second per render.
          </p>

          <div className={styles.staticGrid}>
            {STATIC_VARIANTS.map((v) => {
              const key = variantKey(v);
              const state = staticStates[key];
              return (
                <div key={key} className={styles.staticCard}>
                  <p className={styles.staticCardLabel}>{v.label}</p>
                  <div className={styles.staticImageWrapper}>
                    {state.status === "rendering" || state.status === "idle" ? (
                      <p className={styles.staticImageLoading}>Rendering...</p>
                    ) : null}
                    {state.status === "ready" && state.url ? (
                      <img src={state.url} alt={v.label} />
                    ) : null}
                    {state.status === "error" ? (
                      <p className={styles.staticImageError}>Failed: {state.error}</p>
                    ) : null}
                  </div>
                  {state.status === "ready" ? (
                    <p className={styles.staticCardMeta}>
                      {((state.durationMs || 0) / 1000).toFixed(2)}s · {state.bytesKB || 0} KB
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.kitSection}>
        <div className={styles.container}>
          <h2 className={styles.kitSectionHeader}>The directives the AI generated</h2>
          <p className={styles.kitSectionLead}>
            Every video and static above was generated from this structured directive JSON. The brand brain
            produced it once per campaign — videos and statics consume it without re-running expensive Claude calls.
          </p>
          <div className={styles.directivesPanel}>
            <button
              className={styles.directivesPanelHeader}
              onClick={() => setDirectivesOpen(!directivesOpen)}
              aria-expanded={directivesOpen}
            >
              <div className={styles.directivesPanelHeaderText}>
                <p className={styles.directivesPanelTitle}>
                  {directivesOpen ? "Hide" : "Show"} raw directives JSON
                </p>
                <p className={styles.directivesPanelSubtitle}>
                  {sampleDirectives.directives.length} platform directives · {sampleDirectives.campaign_name}
                </p>
              </div>
              <span
                className={
                  directivesOpen
                    ? styles.directivesPanelChevron + " " + styles.directivesPanelChevronOpen
                    : styles.directivesPanelChevron
                }
              >
                ▶
              </span>
            </button>
            {directivesOpen ? (
              <div className={styles.directivesPanelBody}>
                <pre className={styles.directivesPanelCode}>
                  {formatJsonWithHighlighting(sampleDirectives)}
                </pre>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
