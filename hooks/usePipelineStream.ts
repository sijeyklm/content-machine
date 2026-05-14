"use client";

import { useState, useRef, useCallback } from "react";
import {
  createInitialPipelineState,
  type PipelineState,
  type PipelineStageId,
} from "@/lib/pipeline/types";

type StreamEvent =
  | { type: "stage"; stageId: PipelineStageId; status: "running" | "complete" | "error"; detail?: string; error?: string }
  | { type: "pipeline"; status: "running" | "complete" | "error"; error?: string };

interface UsePipelineStreamResult {
  state: PipelineState;
  isRunning: boolean;
  run: () => Promise<void>;
  reset: () => void;
}

export function usePipelineStream(): UsePipelineStreamResult {
  const [state, setState] = useState<PipelineState>(createInitialPipelineState);
  const isRunningRef = useRef(false);

  const reset = useCallback(() => {
    if (isRunningRef.current) return;
    setState(createInitialPipelineState());
  }, []);

  const run = useCallback(async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const startedAt = Date.now();
    setState({
      ...createInitialPipelineState(),
      status: "running",
      startedAt,
    });

    try {
      const response = await fetch("/api/run-pipeline", {
        method: "POST",
        headers: { "Accept": "text/event-stream" },
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          if (!frame.startsWith("data: ")) continue;
          const json = frame.slice(6).trim();
          if (!json) continue;

          let event: StreamEvent;
          try {
            event = JSON.parse(json) as StreamEvent;
          } catch {
            continue;
          }

          if (event.type === "stage") {
            const stageEvent = event;
            setState((prev) => ({
              ...prev,
              stages: prev.stages.map((s) =>
                s.id === stageEvent.stageId
                  ? {
                      ...s,
                      status: stageEvent.status,
                      startedAt: stageEvent.status === "running" ? Date.now() : s.startedAt,
                      completedAt: stageEvent.status === "complete" ? Date.now() : s.completedAt,
                      detail: stageEvent.detail,
                      error: stageEvent.error,
                    }
                  : s
              ),
            }));
          } else if (event.type === "pipeline") {
            const pipelineEvent = event;
            if (pipelineEvent.status === "complete") {
              setState((prev) => ({
                ...prev,
                status: "complete",
                completedAt: Date.now(),
              }));
            } else if (pipelineEvent.status === "error") {
              setState((prev) => ({
                ...prev,
                status: "error",
              }));
            }
          }
        }
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
      }));
      console.error("Pipeline stream error:", error);
    } finally {
      isRunningRef.current = false;
    }
  }, []);

  return {
    state,
    isRunning: state.status === "running",
    run,
    reset,
  };
}