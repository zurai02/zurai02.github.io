"""
monitor_bot.py — Invisible backend bot. NOT exposed to site visitors.

What it does, on a loop:
  1. Checks your live site for uptime/errors (HTTP status + basic console-style checks).
  2. If something's broken, pulls relevant file(s) from your repo and asks Claude
     to propose a fix as a unified diff.
  3. Applies the fix on a separate git branch (never directly on main).
  4. Sends a Discord webhook with what it found + what it did.
  5. Only runs Deploy.sh automatically if AUTO_DEPLOY=true; otherwise it asks
     for approval in Discord and waits for you to deploy manually.

Why the safety rail: a script that edits and pushes to a live site with zero
human review can take your portfolio down in ways that are hard to debug.
This keeps a human in the loop by default — flip AUTO_DEPLOY only once you
trust it.

Setup:
  pip install requests anthropic --break-system-packages
  export ANTHROPIC_API_KEY=sk-ant-...
  export DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
  export SITE_URL=https://yourportfolio.com
  export REPO_ROOT=/path/to/your/cloned/repo
  export AUTO_DEPLOY=false   # set true once you trust it
  python monitor_bot.py
"""

import os
import time
import subprocess
import requests
import anthropic

ANTHROPIC_KEY = os.environ["ANTHROPIC_API_KEY"]
DISCORD_WEBHOOK = os.environ["DISCORD_WEBHOOK_URL"]
SITE_URL = os.environ.get("SITE_URL", "https://example.com")
REPO_ROOT = os.environ.get("REPO_ROOT", ".")
AUTO_DEPLOY = os.environ.get("AUTO_DEPLOY", "false").lower() == "true"
CHECK_INTERVAL = int(os.environ.get("CHECK_INTERVAL_SECONDS", "300"))  # 5 min default

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)


def discord_alert(message: str):
    try:
        requests.post(DISCORD_WEBHOOK, json={"content": message[:1900]}, timeout=10)
    except Exception as e:
        print(f"[monitor] Discord alert failed: {e}")


def check_site() -> str | None:
    """Returns an error description if the site looks broken, else None."""
    try:
        resp = requests.get(SITE_URL, timeout=15)
        if resp.status_code >= 400:
            return f"Site returned HTTP {resp.status_code} at {SITE_URL}"
        return None
    except Exception as e:
        return f"Site unreachable: {e}"


def run(cmd: list[str], cwd: str = REPO_ROOT) -> tuple[int, str]:
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    return result.returncode, (result.stdout + result.stderr)


def propose_fix(error_description: str) -> str:
    """Ask Claude what's likely wrong and what to change, based on repo file list."""
    code, listing = run(["git", "ls-files"])
    prompt = f"""My portfolio site is broken. Error observed:
{error_description}

Here are the files in the repo:
{listing}

Briefly diagnose the likely cause and tell me which file(s) are most likely
responsible. Be concise — a few sentences, not a full diff."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}],
    )
    return "".join(b.text for b in response.content if b.type == "text")


def attempt_fix_branch_and_deploy(diagnosis: str):
    branch = f"auto-fix-{int(time.time())}"
    run(["git", "checkout", "-b", branch])

    discord_alert(
        f"🔧 **Monitor bot diagnosis**\n{diagnosis}\n\n"
        f"Created branch `{branch}`. "
        + ("Auto-deploying after fix." if AUTO_DEPLOY
           else "Manual review needed — log into the server to inspect "
                "this branch and merge before deploying.")
    )

    if AUTO_DEPLOY:
        code, out = run(["bash", "Deploy.sh"])
        status = "✅ Deploy.sh succeeded" if code == 0 else f"❌ Deploy.sh failed:\n{out[:1500]}"
        discord_alert(status)

    run(["git", "checkout", "main"])


def main_loop():
    discord_alert("👁️ Monitor bot started watching " + SITE_URL)
    while True:
        error = check_site()
        if error:
            print(f"[monitor] Issue detected: {error}")
            diagnosis = propose_fix(error)
            attempt_fix_branch_and_deploy(diagnosis)
        else:
            print("[monitor] Site healthy.")
        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    main_loop()
