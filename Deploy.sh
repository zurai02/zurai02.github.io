#!/usr/bin/env bash
#
# deploy.sh - Build (if needed) and deploy this portfolio site to GitHub Pages
#
# Usage:
#   ./deploy.sh
#
# Assumes:
#   - You're inside the git repo for your portfolio site
#   - Your default/source branch is "main"
#   - Your built/static output goes in a folder (default: "dist")
#   - You publish to a "gh-pages" branch (GitHub Pages serves from here,
#     or change settings to serve from main/docs if you prefer)
#
# Adjust the variables below to match your project.

set -euo pipefail

# ---- Config (edit these to match your project) ----
SOURCE_BRANCH="main"
DEPLOY_BRANCH="gh-pages"
BUILD_DIR="dist"          # change to "." if you have no build step (plain HTML/CSS/JS)
BUILD_CMD="npm run build"  # set to "" if there is no build step
COMMIT_MSG="Deploy site: $(date '+%Y-%m-%d %H:%M:%S')"

# ---- Helpers ----
info()  { echo -e "\033[1;34m==>\033[0m $1"; }
error() { echo -e "\033[1;31mERROR:\033[0m $1" >&2; exit 1; }

# ---- Pre-flight checks ----
command -v git >/dev/null 2>&1 || error "git is not installed."

if [ ! -d ".git" ]; then
  error "This doesn't look like a git repository. Run this script from your project root."
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
  info "Switching to $SOURCE_BRANCH..."
  git checkout "$SOURCE_BRANCH"
fi

if [ -n "$(git status --porcelain)" ]; then
  error "You have uncommitted changes. Commit or stash them before deploying."
fi

info "Pulling latest changes from $SOURCE_BRANCH..."
git pull origin "$SOURCE_BRANCH"

# ---- Build step ----
if [ -n "$BUILD_CMD" ]; then
  info "Building site with: $BUILD_CMD"
  $BUILD_CMD
fi

if [ ! -d "$BUILD_DIR" ]; then
  error "Build directory '$BUILD_DIR' not found. Check BUILD_DIR/BUILD_CMD config."
fi

# ---- Deploy step ----
info "Deploying '$BUILD_DIR' to '$DEPLOY_BRANCH' branch..."

if command -v npx >/dev/null 2>&1; then
  # Easiest option: gh-pages npm package handles the worktree dance for you
  npx --yes gh-pages -d "$BUILD_DIR" -m "$COMMIT_MSG"
else
  # Fallback: manual git subtree push
  TMP_DIR=$(mktemp -d)
  cp -r "$BUILD_DIR"/. "$TMP_DIR"

  git worktree add -f "$DEPLOY_BRANCH" "$DEPLOY_BRANCH" 2>/dev/null || \
    git checkout --orphan "$DEPLOY_BRANCH"

  pushd "$DEPLOY_BRANCH" >/dev/null
  git rm -rf . >/dev/null 2>&1 || true
  cp -r "$TMP_DIR"/. .
  touch .nojekyll
  git add -A
  git commit -m "$COMMIT_MSG" || info "Nothing new to commit."
  git push origin "$DEPLOY_BRANCH"
  popd >/dev/null

  git worktree remove "$DEPLOY_BRANCH" --force 2>/dev/null || true
  rm -rf "$TMP_DIR"
fi

info "Deployed! Your site should be live shortly at:"
info "https://<your-username>.github.io/<your-repo-name>/"
