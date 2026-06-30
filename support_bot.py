"""
support_bot.py — Visible chat widget backend for your portfolio site.

What it does:
  - Serves a small Flask API (POST /chat) that visitors' browser widget calls.
  - Reads your repo's README.md (and optionally other docs) as grounding context.
  - Sends visitor questions + that context to Claude, returns a grounded answer.
  - This is the ONLY bot end users ever talk to. The monitor bot (monitor_bot.py)
    is invisible and never exposed to the public.

Setup:
  pip install flask anthropic flask-cors --break-system-packages
  export ANTHROPIC_API_KEY=sk-ant-...
  python support_bot.py

Then point your site's chat widget (see widget.html) at:
  POST http://your-server:5000/chat   { "message": "..." }
"""

import os
import glob
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import anthropic

app = Flask(__name__)
CORS(app)  # allow your portfolio site's frontend JS to call this API

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

REPO_ROOT = os.environ.get("REPO_ROOT", ".")  # path to your cloned repo on the server


def load_fallback_context() -> str:
    """
    Fallback grounding if the page doesn't send its own context (e.g. AITEXT.md
    on disk). The page-supplied context (see /chat below) is preferred when sent.
    """
    parts = []
    for pattern in ["AITEXT.md", "README.md", "*.md", "manifest.json"]:
        for path in glob.glob(os.path.join(REPO_ROOT, pattern)):
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                parts.append(f"--- {os.path.basename(path)} ---\n{content}")
            except Exception:
                pass
    return "\n\n".join(parts) if parts else "(no docs found)"


SYSTEM_PROMPT_TEMPLATE = """You are the support assistant embedded on a developer's portfolio website.
Answer visitor questions about the portfolio, the projects in it, and the developer's skills,
using ONLY the context below. If something isn't covered in the context, say you don't have
that info and suggest contacting the site owner directly. Keep answers short and friendly,
suited for a small chat widget (2-4 sentences max unless asked for detail).

=== PORTFOLIO CONTEXT ===
{context}
=== END CONTEXT ===
"""


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(force=True) or {}
    user_message = data.get("message", "").strip()
    if not user_message:
        return jsonify({"error": "message is required"}), 400

    # Prefer context sent from the page's <script id="ai-context"> JSON block.
    page_context = data.get("context")
    if page_context:
        if isinstance(page_context, (dict, list)):
            context = json.dumps(page_context, indent=2)
        else:
            context = str(page_context)
    else:
        context = load_fallback_context()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)

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

    return jsonify({"answer": answer})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
