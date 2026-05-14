"use client";

import type {
  PipelineState,
  StageState,
  StageMetadata,
} from "@/lib/pipeline/types";
import { STAGE_METADATA } from "@/lib/pipeline/types";

const BRAND_COLORS = {
  primary: "#2B1810",
  secondary: "#F5EFE0",
  accent: "#B8714D",
  muted: "#A8A29E",
  success: "#5A8A5A",
  error: "#9F1F1F",
};

const formatDuration = (startedAt?: number, completedAt?: number): string => {
  if (!startedAt) return "";
  const end = completedAt ?? Date.now();
  const seconds = (end - startedAt) / 1000;
  return seconds < 10 ? seconds.toFixed(1) + "s" : Math.round(seconds) + "s";
};
interface StageCardProps {
  metadata: StageMetadata;
  state: StageState;
  isLast: boolean;
}

const StageCard: React.FC<StageCardProps> = ({ metadata, state, isLast }) => {
  const isPending = state.status === "pending";
  const isRunning = state.status === "running";
  const isComplete = state.status === "complete";
  const isError = state.status === "error";

  const borderColor = isError
    ? BRAND_COLORS.error
    : isComplete
    ? BRAND_COLORS.primary
    : isRunning
    ? BRAND_COLORS.accent
    : "#E5E5E5";

  const backgroundColor = isError
    ? "#FEF2F2"
    : isComplete
    ? BRAND_COLORS.secondary
    : isRunning
    ? "#FFF5EE"
    : "#FAFAFA";

  const textColor = isPending ? BRAND_COLORS.muted : BRAND_COLORS.primary;

  const statusIndicator = isError
    ? "✕"
    : isComplete
    ? "✓"
    : isRunning
    ? "●"
    : "○";

  const statusIndicatorColor = isError
    ? BRAND_COLORS.error
    : isComplete
    ? BRAND_COLORS.success
    : isRunning
    ? BRAND_COLORS.accent
    : BRAND_COLORS.muted;

  return (
    <div style={{ display: "flex", alignItems: "stretch", flex: 1, minWidth: 0 }}>
      <div
        style={{
          flex: 1,
          padding: "16px",
          backgroundColor,
          border: `2px solid ${borderColor}`,
          borderRadius: 12,
          transition: "all 0.4s ease",
          position: "relative",
          minWidth: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 24, lineHeight: 1 }}>{metadata.icon}</div>
          <div
            style={{
              color: statusIndicatorColor,
              fontSize: 18,
              fontWeight: 600,
              marginLeft: "auto",
              animation: isRunning ? "pulse 1.4s ease-in-out infinite" : "none",
            }}
          >
            {statusIndicator}
          </div>
        </div>

        <div
          style={{
            color: textColor,
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 4,
            transition: "color 0.4s ease",
          }}
        >
          {metadata.label}
        </div>

        <div
          style={{
            color: textColor,
            fontSize: 12,
            opacity: isPending ? 0.6 : 0.8,
            lineHeight: 1.4,
            marginBottom: 8,
            transition: "color 0.4s ease",
          }}
        >
          {metadata.description}
        </div>

        {(isRunning || isComplete) && state.startedAt ? (
          <div
            style={{
              fontSize: 11,
              color: statusIndicatorColor,
              fontWeight: 500,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDuration(state.startedAt, state.completedAt)}
          </div>
        ) : null}

        {isError && state.error ? (
          <div style={{ fontSize: 11, color: BRAND_COLORS.error, marginTop: 4 }}>
            {state.error}
          </div>
        ) : null}
      </div>

      {!isLast ? (
        <div
          style={{
            width: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 2,
              backgroundColor: isComplete ? BRAND_COLORS.primary : "#E5E5E5",
              transition: "background-color 0.4s ease",
            }}
          />
        </div>
      ) : null}
    </div>
  );
};
interface PipelineViewProps {
  state: PipelineState;
}

export const PipelineView: React.FC<PipelineViewProps> = ({ state }) => {
  return (
    <div style={{ width: "100%" }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.9); }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          gap: 0,
          width: "100%",
        }}
      >
        {STAGE_METADATA.map((metadata, i) => {
          const stageState = state.stages.find((s) => s.id === metadata.id);
          if (!stageState) return null;
          return (
            <StageCard
              key={metadata.id}
              metadata={metadata}
              state={stageState}
              isLast={i === STAGE_METADATA.length - 1}
            />
          );
        })}
      </div>

      <PipelineSummary state={state} />
    </div>
  );
};

const PipelineSummary: React.FC<{ state: PipelineState }> = ({ state }) => {
  const completedCount = state.stages.filter((s) => s.status === "complete").length;
  const totalCount = state.stages.length;
  const progress = (completedCount / totalCount) * 100;

  const summaryText =
    state.status === "idle"
      ? "Ready to run"
      : state.status === "running"
      ? `Running ${completedCount} of ${totalCount} stages complete`
      : state.status === "complete"
      ? `Complete in ${formatDuration(state.startedAt, state.completedAt)}`
      : "Pipeline error";

  const summaryColor =
    state.status === "error"
      ? BRAND_COLORS.error
      : state.status === "complete"
      ? BRAND_COLORS.success
      : BRAND_COLORS.primary;

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 500, color: summaryColor }}>
          {summaryText}
        </div>
        <div style={{ fontSize: 12, color: BRAND_COLORS.muted, fontVariantNumeric: "tabular-nums" }}>
          {completedCount} / {totalCount}
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: 4,
          backgroundColor: "#E5E5E5",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: state.status === "complete" ? BRAND_COLORS.success : BRAND_COLORS.accent,
            transition: "width 0.4s ease, background-color 0.4s ease",
          }}
        />
      </div>
    </div>
  );
};