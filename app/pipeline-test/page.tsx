"use client";

import Link from "next/link";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { usePipelineStream } from "@/hooks/usePipelineStream";

export default function PipelineTestPage() {
  const { state, isRunning, run, reset } = usePipelineStream();

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>Pipeline test</h1>
      <p style={{ color: "#666", marginBottom: 32 }}>
        Run the real brand brain pipeline end-to-end. Each stage streams its status as it completes.
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 40 }}>
        <button
          onClick={run}
          disabled={isRunning}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: isRunning ? "#999" : "#2B1810",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isRunning ? "wait" : "pointer",
          }}
        >
          {isRunning ? "Pipeline running..." : "Run pipeline"}
        </button>
        <button
          onClick={reset}
          disabled={isRunning}
          style={{
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: "transparent",
            color: isRunning ? "#999" : "#2B1810",
            border: "1px solid " + (isRunning ? "#ddd" : "#2B1810"),
            borderRadius: 6,
            cursor: isRunning ? "wait" : "pointer",
          }}
        >
          Reset
        </button>
      </div>

      <PipelineView state={state} />

      {state.status === "complete" ? (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(43, 24, 16, 0.1)" }}>
          <Link
            href="/kit"
            style={{
              display: "inline-block",
              padding: "14px 28px",
              backgroundColor: "#B8714D",
              color: "#F5EFE0",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View the rendered kit →
          </Link>
        </div>
      ) : null}
    </main>
  );
}
