import fs from "fs/promises";
import path from "path";
import { embedBatch, embedText } from "./embeddings";

export interface PastAd {
  id: string;
  platform: string;
  format: string;
  aspect_ratio: string;
  campaign: string;
  launched: string;
  hook: string;
  body_copy: string;
  cta: string;
  concept: string;
  performance: {
    ctr_pct: number;
    cpa_usd: number;
    roas: number;
    spend_usd: number;
    audience: string;
  };
  performance_tier: "top_performer" | "average" | "underperformer";
  retrieval_text: string;
}

interface IndexedAd extends PastAd {
  embedding: number[];
}

export interface RetrievalResult {
  ad: PastAd;
  similarity: number;
}

/**
 * In-memory index of past ads with their embeddings.
 *
 * Lazy-loaded singleton: the first call to retrieveSimilar() builds the index;
 * subsequent calls reuse it. For 5 past ads this is trivial, but the pattern
 * scales — swap this in-memory store for pgvector or Pinecone later without
 * changing the retrieval interface.
 */
let indexCache: IndexedAd[] | null = null;

async function buildIndex(): Promise<IndexedAd[]> {
  const filePath = path.join(process.cwd(), "public/samples/past-ads.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const pastAds: PastAd[] = JSON.parse(raw);

  // Embed all retrieval_text strings in one batch call
  const embeddings = await embedBatch(
    pastAds.map((ad) => ad.retrieval_text),
    "document"
  );

  return pastAds.map((ad, i) => ({ ...ad, embedding: embeddings[i] }));
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns a number between -1 and 1 (typically 0 to 1 for embedding vectors).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector length mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Retrieve the top-K most similar past ads to a given query.
 *
 * @param query - The campaign brief or other search text
 * @param topK - Number of results to return (default 3)
 * @param filter - Optional filter applied before similarity ranking
 */
export async function retrieveSimilar(
  query: string,
  topK: number = 3,
  filter?: (ad: PastAd) => boolean
): Promise<RetrievalResult[]> {
  if (!indexCache) {
    indexCache = await buildIndex();
  }

  const queryEmbedding = await embedText(query, "query");

  let candidates = indexCache;
  if (filter) {
    candidates = candidates.filter(filter);
  }

  const scored = candidates.map((ad) => ({
    ad: {
      id: ad.id,
      platform: ad.platform,
      format: ad.format,
      aspect_ratio: ad.aspect_ratio,
      campaign: ad.campaign,
      launched: ad.launched,
      hook: ad.hook,
      body_copy: ad.body_copy,
      cta: ad.cta,
      concept: ad.concept,
      performance: ad.performance,
      performance_tier: ad.performance_tier,
      retrieval_text: ad.retrieval_text,
    } as PastAd,
    similarity: cosineSimilarity(queryEmbedding, ad.embedding),
  }));

  // Sort descending by similarity, return top K
  return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
}

/**
 * Convenience filter factories for common retrieval scenarios.
 */
export const filters = {
  topPerformersOnly: (ad: PastAd) => ad.performance_tier === "top_performer",
  byPlatform: (platform: string) => (ad: PastAd) => ad.platform === platform,
  excludeUnderperformers: (ad: PastAd) =>
    ad.performance_tier !== "underperformer",
};