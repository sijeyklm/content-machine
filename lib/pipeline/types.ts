/**
 * The five pipeline stages, in execution order.
 *
 * 1. intake     - Parse the brand book PDF
 * 2. rules      - Extract structured brand rules with Claude
 * 3. retrieval  - Find similar past ads via embedding similarity
 * 4. directives - Generate platform-specific creative directives
 * 5. render     - Produce video + static deliverables
 */
export type PipelineStageId =
  | "intake"
  | "rules"
  | "retrieval"
  | "directives"
  | "render";

export type StageStatus = "pending" | "running" | "complete" | "error";

export interface StageState {
  id: PipelineStageId;
  status: StageStatus;
  startedAt?: number;
  completedAt?: number;
  detail?: string;
  error?: string;
}

export interface PipelineState {
  stages: StageState[];
  startedAt?: number;
  completedAt?: number;
  status: "idle" | "running" | "complete" | "error";
}

/**
 * Stage display metadata. Decoupled from state so the UI can render
 * consistent labels and icons regardless of the runtime state.
 */
export interface StageMetadata {
  id: PipelineStageId;
  label: string;
  description: string;
  icon: string; // emoji for now; can swap to lucide-react later
}

export const STAGE_METADATA: StageMetadata[] = [
  {
    id: "intake",
    label: "Intake",
    description: "Parse brand book",
    icon: "📄",
  },
  {
    id: "rules",
    label: "Rules",
    description: "Extract brand voice & visual rules",
    icon: "🎨",
  },
  {
    id: "retrieval",
    label: "Retrieval",
    description: "Find similar past winners",
    icon: "🔍",
  },
  {
    id: "directives",
    label: "Directives",
    description: "Generate per-channel directions",
    icon: "✍️",
  },
  {
    id: "render",
    label: "Render",
    description: "Produce video + static kit",
    icon: "🎬",
  },
];

/**
 * Initial pipeline state with all stages pending.
 */
export const createInitialPipelineState = (): PipelineState => ({
  stages: STAGE_METADATA.map((meta) => ({
    id: meta.id,
    status: "pending" as StageStatus,
  })),
  status: "idle" as const,
});