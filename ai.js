/**
 * ai.js — Self-contained portfolio AI. No API key. Runs 100% locally.
 *
 * How it works:
 *   1. Reads your HTML, CSS, README, manifest.json as training data.
 *   2. Splits content into chunks and generates vector embeddings using a
 *      real transformer model (~80MB, downloaded once, stored locally).
 *   3. When a visitor asks a question, finds the most semantically similar
 *      chunks and builds an answer from them.
 *   4. Learns more each time you add/change files — just re-run train().
 *
 * Setup:
 *   npm install @xenova/transformers express cors
 *   node ai.js train     ← index your portfolio content (run after changes)
 *   node ai.js serve     ← start the chat API on localhost:5000
 *
 * Your chat widget calls:
 *   POST http://localhost:5000/chat   { "message": "..." }
 */

const { pipeline, env } = require("@xenova/transformers");
const express = require("express");
const cors    = require("cors");
const fs      = require("fs");
const path    = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const MODEL_NAME   = "Xenova/all-MiniLM-L6-v2";   // 80MB, runs locally
const VECTOR_DB    = "./portfolio_vectors.json";    // persisted embeddings
const REPO_ROOT    = process.env.REPO_ROOT || ".";
const PORT         = process.env.PORT || 5000;
const CHUNK_SIZE   = 200;   // words per chunk
const TOP_K        = 3;     // how many chunks to use per answer

// Cache the model so it only loads once
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    console.log("[ai] loading model (first run downloads ~80MB)...");
    env.cacheDir = "./model_cache";
    embedder = await pipeline("feature-extraction", MODEL_NAME);
    console.log("[ai] model ready.");
  }
  return embedder;
}


// ── File reader ───────────────────────────────────────────────────────────────

function readPortfolioFiles() {
  const targets = [
    "index.html", "style.css", "site.js", "README.md",
    "manifest.json", "AITEXT.md", "robots.txt"
  ];
  const docs = [];
  for (const name of targets) {
    const p = path.join(REPO_ROOT, name);
    if (fs.existsSync(p)) {
      const text = fs.readFileSync(p, "utf-8")
        .replace(/<[^>]+>/g, " ")   // strip HTML tags
        .replace(/\s+/g, " ")
        .trim();
      if (text.length > 50) {
        docs.push({ source: name, text });
        console.log(`[ai] loaded: ${name} (${text.length} chars)`);
      }
    }
  }
  return docs;
}


// ── Chunking ──────────────────────────────────────────────────────────────────

function chunkText(text, source) {
  const words  = text.split(" ");
  const chunks = [];
  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(" ");
    if (chunk.trim().length > 30) {
      chunks.push({ source, text: chunk });
    }
  }
  return chunks;
}


// ── Embeddings ────────────────────────────────────────────────────────────────

async function embed(text) {
  const model  = await getEmbedder();
  const output = await model(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

function cosineSimilarity(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}


// ── Train ─────────────────────────────────────────────────────────────────────

async function train() {
  console.log("\n[ai] training on portfolio content...");
  const docs   = readPortfolioFiles();
  const chunks = docs.flatMap(d => chunkText(d.text, d.source));
  console.log(`[ai] ${chunks.length} chunks to embed...`);

  const vectors = [];
  for (let i = 0; i < chunks.length; i++) {
    process.stdout.write(`\r[ai] embedding ${i + 1}/${chunks.length}`);
    const vec = await embed(chunks[i].text);
    vectors.push({ ...chunks[i], vector: vec });
  }

  fs.writeFileSync(VECTOR_DB, JSON.stringify(vectors, null, 2));
  console.log(`\n[ai] done — saved ${vectors.length} vectors to ${VECTOR_DB}`);
  console.log("[ai] run 'node ai.js serve' to start the chat server.");
}


// ── Answer ────────────────────────────────────────────────────────────────────

async function answer(question) {
  if (!fs.existsSync(VECTOR_DB)) {
    return "I haven't been trained yet. Run: node ai.js train";
  }

  const vectors  = JSON.parse(fs.readFileSync(VECTOR_DB, "utf-8"));
  const qVec     = await embed(question);

  // Rank all chunks by similarity to the question
  const ranked = vectors
    .map(v => ({ ...v, score: cosineSimilarity(qVec, v.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  if (ranked[0].score < 0.25) {
    return "I don't have enough info about that in my portfolio data yet.";
  }

  // Build answer from top chunks
  const context = ranked.map(r => `[${r.source}]: ${r.text}`).join("\n\n");

  return buildAnswer(question, context, ranked);
}


function buildAnswer(question, context, chunks) {
  // Extract the most relevant sentences from context
  const sentences = context
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20);

  const qWords = new Set(question.toLowerCase().split(/\W+/));

  // Score sentences by keyword overlap with question
  const scored = sentences.map(s => {
    const sWords = s.toLowerCase().split(/\W+/);
    const overlap = sWords.filter(w => qWords.has(w) && w.length > 3).length;
    return { s, overlap };
  });

  scored.sort((a, b) => b.overlap - a.overlap);
  const best = scored.slice(0, 3).map(x => x.s).join(". ");

  return best.length > 30
    ? best + "."
    : `Based on my portfolio data (from ${chunks[0].source}): ${chunks[0].text.slice(0, 200)}...`;
}


// ── Server ────────────────────────────────────────────────────────────────────

async function serve() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Warm up embedder on start
  await getEmbedder();

  app.post("/chat", async (req, res) => {
    const message = (req.body.message || "").trim();
    if (!message) return res.status(400).json({ error: "message required" });

    try {
      const reply = await answer(message);
      res.json({ answer: reply });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });

  app.get("/health", (_, res) => res.json({ status: "ok" }));

  app.listen(PORT, () => {
    console.log(`\n🤖 Portfolio AI running at http://localhost:${PORT}`);
    console.log("   POST /chat  { \"message\": \"...\" }\n");
  });
}


// ── CLI ───────────────────────────────────────────────────────────────────────

const cmd = process.argv[2];
if (cmd === "train") {
  train().catch(console.error);
} else if (cmd === "serve") {
  serve().catch(console.error);
} else {
  console.log(`
Usage:
  node ai.js train    ← index your portfolio files (re-run after edits)
  node ai.js serve    ← start chat API on localhost:${PORT}
  `);
}
