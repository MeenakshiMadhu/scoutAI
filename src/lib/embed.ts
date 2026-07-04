// SHARED EMBED HELPER used by both offline script and resume route.
import { pipeline } from "@xenova/transformers";

// cache the model across warm invocations — loading is the expensive part
let _embedder: any = null;

async function getEmbedder() {
  if (!_embedder) {
    _embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return _embedder;
}

export async function embedText(text: string): Promise<number[]> {
  const embedder = await getEmbedder();
  const res = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(res.data as Float32Array);
}

// cosine similarity — vectors are already normalized, so this is just the dot product,
// but we keep the full formula so it's correct even if normalization changes.
export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
