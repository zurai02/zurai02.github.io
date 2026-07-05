"""
support_bot.py — Self-learning chat widget backend for zurai02's portfolio.

What it does:
  - Serves a Flask API (POST /chat) that the portfolio chat widget calls.
  - Reads README.md / AITEXT.md as base grounding context.
  - Sends visitor questions + context to Claude, returns grounded answers.
  - SELF-LEARNING: stores every Q&A, extracts knowledge from good answers,
    and injects that learned knowledge into future prompts automatically.
  - POST /feedback  → visitor thumbs up/down teaches the bot what works.
  - GET  /stats     → see how much the bot has learned over time.

Setup:
  pip install flask anthropic flask-cors --break-system-packages
  export ANTHROPIC_API_KEY=sk-ant-...
  python support_bot.py
"""

import os
import glob
import json
import time
import hashlib
from datetime import datetime
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic

app = Flask(__name__)
CORS(app)

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

REPO_ROOT   = os.environ.get("REPO_ROOT", ".")
MEMORY_FILE = os.environ.get("MEMORY_FILE", "bot_memory.json")   # persisted learning
MAX_LEARNED = 40   # cap injected learned facts so prompt doesn't bloat


# ── Memory helpers ──────────────────────────────────────────────────────────

def load_memory() -> dict:
    if Path(MEMORY_FILE).exists():
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "learned_facts": [],      # distilled knowledge nuggets
        "conversations": [],      # full history (question + answer + rating)
        "stats": {
            "total_chats": 0,
            "positive_feedback": 0,
            "negative_feedback": 0,
            "facts_learned": 0,
        }
    }


def save_memory(memory: dict):
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(memory, f, indent=2, ensure_ascii=False)


def conversation_id(question: str) -> str:
    return hashlib.sha1(
        f"{question}{time.time()}".encode()
    ).hexdigest()[:12]


# ── Context loaders ─────────────────────────────────────────────────────────

def load_base_context() -> str:
    parts = []
    for pattern in ["AITEXT.md", "README.md", "*.md", "manifest.json"]:
        for path in glob.glob(os.path.join(REPO_ROOT, pattern)):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    parts.append(f"--- {os.path.basename(path)} ---\n{f.read()}")
            except Exception:
                pass
    return "\n\n".join(parts) if parts else "(no docs found)"


def build_learned_context(memory: dict) -> str:
    """Top learned facts, newest first, capped at MAX_LEARNED."""
    facts = memory.get("learned_facts", [])[-MAX_LEARNED:]
    if not facts:
        return ""
    lines = "\n".join(f"- {f['fact']}" for f in facts)
    return f"\n\n=== LEARNED FROM PAST CONVERSATIONS ===\n{lines}\n=== END LEARNED ==="


# ── Learning engine ─────────────────────────────────────────────────────────

def extract_facts(question: str, answer: str) -> list[str]:
    """
    Ask Claude to distill 1-3 reusable facts from a good Q&A pair.
    Returns a list of short fact strings to add to memory.
    """
    prompt = (
        f"A visitor asked: \"{question}\"\n"
        f"The bot answered: \"{answer}\"\n\n"
        "Extract 1 to 3 short, reusable facts from this answer that would help "
        "answer similar questions in future. Each fact should be a single sentence. "
        "Reply ONLY with a JSON array of strings, e.g. [\"Fact one.\", \"Fact two.\"]"
    )
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        raw = resp.content[0].text.strip()
        # Strip markdown fences if present
        raw = raw.replace("```json", "").replace("```", "").strip()
        facts = json.loads(raw)
        return [f for f in facts if isinstance(f, str) and len(f) > 10]
    except Exception:
        return []


def learn_from_conversation(memory: dict, conv_id: str):
    """Find a conversation by ID and extract facts if it was rated positively."""
    conv = next(
        (c for c in memory["conversations"] if c["id"] == conv_id), None
    )
    if not conv or conv.get("rating") != "positive":
        return

    new_facts = extract_facts(conv["question"], conv["answer"])
    for fact in new_facts:
        # Avoid near-duplicate facts
        existing = [f["fact"].lower() for f in memory["learned_facts"]]
        if fact.lower() not in existing:
            memory["learned_facts"].append({
                "fact": fact,
                "source_id": conv_id,
                "learned_at": datetime.utcnow().isoformat(),
            })
            memory["stats"]["facts_learned"] += 1

    save_memory(memory)


# ── Prompts ─────────────────────────────────────────────────────────────────

SYSTEM_TEMPLATE = """You are the support assistant embedded on zurai02's developer portfolio.
Answer visitor questions about the portfolio, projects, and skills using ONLY the context below.
If something isn't covered, say you don't have that info and suggest contacting the owner.
Keep answers short and friendly — 2-4 sentences max unless asked for detail.

=== PORTFOLIO CONTEXT ===
{base_context}
=== END CONTEXT ==={learned_context}"""


# ── Routes ───────────────────────────────────────────────────────────────────

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "message is required"}), 400

    memory = load_memory()

    # Page-supplied context wins; else fall back to docs on disk
    page_context = data.get("context")
    if page_context:
        base_ctx = json.dumps(page_context, indent=2) if isinstance(page_context, (dict, list)) else str(page_context)
    else:
        base_ctx = load_base_context()

    learned_ctx = build_learned_context(memory)
    system_prompt = SYSTEM_TEMPLATE.format(
        base_context=base_ctx,
        learned_context=learned_ctx,
    )

    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        answer = "".join(
            block.text for block in response.content if block.type == "text"
        )
    except Exception as e:
        return jsonify({"error": f"AI request failed: {e}"}), 500

    # Store conversation
    conv_id = conversation_id(user_message)
    memory["conversations"].append({
        "id": conv_id,
        "question": user_message,
        "answer": answer,
        "rating": None,
        "timestamp": datetime.utcnow().isoformat(),
    })
    memory["stats"]["total_chats"] += 1
    save_memory(memory)

    return jsonify({"answer": answer, "conv_id": conv_id})


@app.route("/feedback", methods=["POST"])
def feedback():
    """
    Visitor rates a response. Positive ratings trigger fact extraction.
    Body: { "conv_id": "abc123", "rating": "positive" | "negative" }
    """
    data = request.get_json(force=True) or {}
    conv_id = data.get("conv_id", "").strip()
    rating  = data.get("rating", "").strip()

    if not conv_id or rating not in ("positive", "negative"):
        return jsonify({"error": "conv_id and rating (positive/negative) required"}), 400

    memory = load_memory()
    conv = next((c for c in memory["conversations"] if c["id"] == conv_id), None)
    if not conv:
        return jsonify({"error": "conversation not found"}), 404

    conv["rating"] = rating
    if rating == "positive":
        memory["stats"]["positive_feedback"] += 1
    else:
        memory["stats"]["negative_feedback"] += 1
    save_memory(memory)

    # Learn asynchronously (same thread, fast enough for a portfolio)
    if rating == "positive":
        learn_from_conversation(memory, conv_id)

    return jsonify({"status": "thanks, bot updated!"})


@app.route("/stats", methods=["GET"])
def stats():
    """How much has the bot learned?"""
    memory = load_memory()
    return jsonify({
        **memory["stats"],
        "learned_facts_preview": [
            f["fact"] for f in memory["learned_facts"][-5:]
        ],
    })


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
