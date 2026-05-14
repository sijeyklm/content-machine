import { parseBrandBookFromBuffer } from "@/lib/brand-brain/pdf-parse";
import { extractBrandRules } from "@/lib/brand-brain/extract-rules";
import { retrieveSimilar } from "@/lib/brand-brain/retrieve";
import { generateDirectives } from "@/lib/brand-brain/directives";
import type { PipelineStageId } from "@/lib/pipeline/types";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const maxDuration = 300;

interface StageEvent {
  type: "stage";
  stageId: PipelineStageId;
  status: "running" | "complete" | "error";
  detail?: string;
  error?: string;
}

interface PipelineEvent {
  type: "pipeline";
  status: "running" | "complete" | "error";
  error?: string;
}

type StreamEvent = StageEvent | PipelineEvent;

/**
 * Encode an event as a Server-Sent Events frame.
 * SSE format: "data: <json>\n\n" — the double newline terminates the frame.
 */
const sseFrame = (event: StreamEvent): string =>
  `data: ${JSON.stringify(event)}\n\n`;
/**
 * POST /api/run-pipeline
 *
 * Runs the brand brain pipeline end-to-end (intake → rules → retrieval → directives → render).
 * Streams stage status updates to the client via Server-Sent Events.
 *
 * Render stage is currently mocked as instant complete; real render happens
 * via the existing /api/render-video and /api/render-static endpoints.
 */
export async function POST() {
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(sseFrame(event)));
      };

      try {
        send({ type: "pipeline", status: "running" });

        // Stage 1: intake — parse the brand book PDF
        send({ type: "stage", stageId: "intake", status: "running" });
        const pdfPath = path.join(process.cwd(), "public/samples/northbean-brand-book.pdf");
        const pdfBuffer = await fs.readFile(pdfPath);
        const parsed = await parseBrandBookFromBuffer(pdfBuffer);
send({ type: "stage", stageId: "intake", status: "complete", detail: `${parsed.charCount} chars extracted` });

        // Stage 2: rules — extract structured brand rules
        send({ type: "stage", stageId: "rules", status: "running" });
        const rules = await extractBrandRules(parsed.rawText);
        send({ type: "stage", stageId: "rules", status: "complete", detail: rules.brand.name });

        // Stage 3: retrieval — find similar past ads
send({ type: "stage", stageId: "retrieval", status: "running" });
const briefPath = path.join(process.cwd(), "public/samples/sample-brief.json");
const briefRaw = await fs.readFile(briefPath, "utf-8");
const brief = JSON.parse(briefRaw);
const queryString = brief.key_message || brief.objective || JSON.stringify(brief);
const similarAds = await retrieveSimilar(queryString, 3);
send({ type: "stage", stageId: "retrieval", status: "complete", detail: `${similarAds.length} similar ads found` });

        // Stage 4: directives — generate platform-specific creative directions
        send({ type: "stage", stageId: "directives", status: "running" });
        const directives = await generateDirectives({ brief, rules });
        const directiveCount = Object.keys(directives).length;
        send({ type: "stage", stageId: "directives", status: "complete", detail: `${directiveCount} platform directives` });

        // Stage 5: render — mocked as instant for demo flow
        send({ type: "stage", stageId: "render", status: "running" });
        await new Promise((resolve) => setTimeout(resolve, 800));
        send({ type: "stage", stageId: "render", status: "complete", detail: "Ready to produce kit" });

        send({ type: "pipeline", status: "complete" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Pipeline error";
        send({ type: "pipeline", status: "error", error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}