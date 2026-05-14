const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_MODEL = "voyage-3.5-lite";

export type EmbeddingInputType = "document" | "query";

interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

/**
 * Call Voyage's embedding API with automatic retry on rate limit errors.
 * Returns the response data array in input order.
 */
async function callVoyage(
  input: string | string[],
  inputType: EmbeddingInputType
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("VOYAGE_API_KEY is not set in environment");
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input,
        model: VOYAGE_MODEL,
        input_type: inputType,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as VoyageEmbeddingResponse;
      if (!data.data || data.data.length === 0) {
        throw new Error("Voyage returned no embeddings");
      }
      const sorted = [...data.data].sort((a, b) => a.index - b.index);
      return sorted.map((item) => item.embedding);
    }

    const errorText = await response.text();

    if (response.status === 429 && attempt < maxRetries) {
      const backoffMs = Math.pow(2, attempt) * 1000;
      console.warn(
        `Voyage rate limited (attempt ${attempt}/${maxRetries}), retrying in ${backoffMs}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      lastError = new Error(`Rate limited: ${errorText}`);
      continue;
    }

    throw new Error(`Voyage API error ${response.status}: ${errorText}`);
  }

  throw lastError ?? new Error("Voyage API failed after retries");
}

/**
 * Generate an embedding vector for a single piece of text.
 */
export async function embedText(
  text: string,
  inputType: EmbeddingInputType = "document"
): Promise<number[]> {
  const results = await callVoyage(text, inputType);
  return results[0];
}

/**
 * Batch embedding for efficiency.
 */
export async function embedBatch(
  texts: string[],
  inputType: EmbeddingInputType = "document"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  return callVoyage(texts, inputType);
}
