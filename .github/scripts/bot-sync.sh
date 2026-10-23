#!/usr/bin/env bash
# Shared helper for workflows that need to update generated files on main.
#
# main is protected (requires a PR + passing "lint" check), so bots can't push
# to it directly. Instead every bot update goes to one rolling branch
# ($BOT_BRANCH) with at most one open, auto-merging PR. Each run first merges
# the latest main into that branch, so the PR never falls behind main and
# separate workflows (readme-sync, link-check) never open competing PRs.
#
# Usage:
#   bot-sync.sh checkout                 # switch to the bot branch, up to date with main
#   bot-sync.sh publish "<message>"      # commit generated files, push, open/update the PR
set -euo pipefail

BOT_BRANCH="${BOT_BRANCH:-bot/repo-sync}"
# Every file a bot is allowed to touch. Listed once so "does the bot branch
# still differ from main?" covers changes made by either workflow.
BOT_FILES=(CHANGELOG.md .github/badges/entries.json .github/badges/broken-links.json)

checkout() {
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git fetch origin main
  if git ls-remote --exit-code --heads origin "$BOT_BRANCH" > /dev/null; then
    git fetch origin "$BOT_BRANCH"
    git checkout -B "$BOT_BRANCH" "origin/$BOT_BRANCH"
    git merge --no-edit origin/main
  else
    git checkout --no-track -B "$BOT_BRANCH" origin/main
  fi
}

publish() {
  local message="$1"
  git add -- "${BOT_FILES[@]}"
  if ! git diff --cached --quiet; then
    git commit -m "$message"
  fi

  if git diff --quiet origin/main -- "${BOT_FILES[@]}"; then
    echo "Generated files already match main, nothing to propose."
    return 0
  fi

  git push origin "$BOT_BRANCH"

  local existing
  existing=$(gh pr list --head "$BOT_BRANCH" --state open --json number --jq '.[0].number // empty')
  if [ -n "$existing" ]; then
    echo "Updated existing bot PR #$existing."
  else
    gh pr create --base main --head "$BOT_BRANCH" \
      --title "chore: sync generated files (changelog, badges)" \
      --body "Automated update from the \`readme-sync\` / \`link-check\` workflows. This PR is reused by later runs until it merges."
  fi
  gh pr merge "$BOT_BRANCH" --auto --squash --delete-branch
}

case "${1:-}" in
  checkout) checkout ;;
  publish) publish "${2:?commit message required}" ;;
  *) echo "usage: $0 {checkout|publish <message>}" >&2; exit 2 ;;
esac
