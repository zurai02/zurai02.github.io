/**
 * transformer.js — Local transformer pipeline for zurai02's portfolio AI.
 *
 * Wraps @xenova/transformers with:
 *   - Model caching (downloads once, reuses forever)
 *   - Embedding generation
 *   - Text classification
 *   - Question answering
 *   - Zero-shot intent detection (understand what a visitor is asking about)
 *
 * Used by ai.js internally — you can also import it directly:
 *   const { getEmbedder, classify, qa, detectIntent } = require("./transformer");
 */

const { pipeline, env } = require("@xenova/transformers");
const path = require("path");

// ── Model config ──────────────────────────────────────────────────────────────
env.cacheDir = path.join(__dirname, "model_cache");
env.allowRemoteModels = true;   // set false once models are cached for offline use

const MODELS = {
  embedder:   "Xenova/all-MiniLM-L6-v2",          // 80MB  — semantic similarity
  classifier: "Xenova/distilbart-mnli-12-1",       // 250MB — zero-shot intent
  qa:         "Xenova/distilbert-base-cased-distilled-squad", // 130MB — Q&A
};

// Singleton cache — models load once per process
const _cache = {};

async function loadModel(task, model) {
  const key = `${task}::${model}`;
  if (!_cache[key]) {
    console.log(`[transformer] loading ${model} ...`);
    _cache[key] = await pipeline(task, model);
    console.log(`[transformer] ${model} ready.`);
  }
  return _cache[key];
}


// ── Embeddings ────────────────────────────────────────────────────────────────

/**
 * Generate a normalized embedding vector for a string.
 * Used for semantic search / similarity matching.
 */
async function embed(text) {
  const model  = await loadModel("feature-extraction", MODELS.embedder);
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Cosine similarity between two embedding vectors. Returns -1 to 1.
 */
function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

/**
 * Rank an array of { text, ...meta } chunks by similarity to a query.
 * Returns sorted array with .score added to each item.
 */
async function rankChunks(query, chunks) {
  const qVec   = await embed(query);
  const scored = await Promise.all(
    chunks.map(async (c) => {
      const vec   = c.vector || (await embed(c.text));
      const score = cosineSimilarity(qVec, vec);
      return { ...c, score };
    })
  );
  return scored.sort((a, b) => b.score - a.score);
}


// ── Zero-shot intent detection ────────────────────────────────────────────────

const INTENTS = [
  "asking about projects",
  "asking about skills or tech stack",
  "asking about contact information",
  "asking about who the developer is",
  "asking about work experience",
  "asking about the website itself",
  "greeting or small talk",
  "asking about availability or hiring",
];

/**
 * Detect what a visitor's message is really about.
 * Returns { intent: string, score: number }
 */
async function detectIntent(message) {
  const model  = await loadModel("zero-shot-classification", MODELS.classifier);
  const result = await model(message, INTENTS);
  return {
    intent: result.labels[0],
    score:  result.scores[0],
    all:    result.labels.map((l, i) => ({ label: l, score: result.scores[i] })),
  };
}


// ── Extractive Q&A ────────────────────────────────────────────────────────────

/**
 * Given a question and a context string, extract the most likely answer span.
 * Returns { answer: string, score: number, start: number, end: number }
 */
async function qa(question, context) {
  const model  = await loadModel("question-answering", MODELS.qa);
  const result = await model({ question, context });
  return result;
}


// ── Full pipeline: question → best answer ─────────────────────────────────────

/**
 * High-level: given a question and an array of text chunks (from your portfolio),
 * returns the best answer using embed → rank → extractive QA.
 *
 * chunks: [{ text: string, source: string, vector?: number[] }, ...]
 */
async function answerFromChunks(question, chunks, topK = 3) {
  if (!chunks || chunks.length === 0) {
    return { answer: "I don't have enough portfolio data to answer that yet.", confidence: 0 };
  }

  // 1. Rank chunks by semantic similarity
  const ranked = await rankChunks(question, chunks);
  const top    = ranked.slice(0, topK);

  if (top[0].score < 0.20) {
    return {
      answer: "That doesn't seem to be covered in my portfolio data.",
      confidence: top[0].score,
    };
  }

  // 2. Combine top chunks into one context block
  const context = top.map(c => c.text).join(" ");

  // 3. Extractive QA on the combined context
  try {
    const result = await qa(question, context);
    return {
      answer:     result.answer,
      confidence: result.score,
      sources:    top.map(c => c.source),
    };
  } catch {
    // Fallback: return the top chunk directly
    return {
      answer:     top[0].text.slice(0, 300),
      confidence: top[0].score,
      sources:    [top[0].source],
    };
  }
}


// ── Warm up all models ────────────────────────────────────────────────────────

/**
 * Pre-load all models into cache. Call on server startup so first
 * visitor request isn't slow.
 */
async function warmup() {
  console.log("[transformer] warming up models...");
  await Promise.all([
    loadModel("feature-extraction",      MODELS.embedder),
    loadModel("zero-shot-classification", MODELS.classifier),
    loadModel("question-answering",       MODELS.qa),
  ]);
  console.log("[transformer] all models ready.");
}


// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  embed,
  cosineSimilarity,
  rankChunks,
  detectIntent,
  qa,
  answerFromChunks,
  warmup,
};
