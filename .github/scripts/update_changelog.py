#!/usr/bin/env python3
import datetime
import os
import re
import subprocess
import sys

CHANGELOG = "CHANGELOG.md"
START = "<!-- changelog-entries-start -->"
SHA_RE = re.compile(r"<!-- changelog-last-sha: ([0-9a-f]{7,40}) -->")
ENTRY_RE = re.compile(r"^- \*\*\[(.+?)\]\(")

def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout

def entries(ref):
    readme = git("show", f"{ref}:README.md")
    return [line for line in readme.splitlines() if ENTRY_RE.match(line)]

def name(line):
    return ENTRY_RE.match(line).group(1).strip().lower()

def main():
    target = git("rev-parse", sys.argv[1] if len(sys.argv) > 1 else "HEAD").strip()
    text = open(CHANGELOG, encoding="utf-8").read()
    marker = SHA_RE.search(text)

    def set_marker(t):
        new = f"<!-- changelog-last-sha: {target} -->"
        return SHA_RE.sub(new, t) if SHA_RE.search(t) else t.replace(START, f"{new}\n{START}", 1)

    if not marker:
        open(CHANGELOG, "w", encoding="utf-8").write(set_marker(text))
        print(f"No changelog-last-sha marker found, initialised it to {target}.")
        return
    last = marker.group(1)
    if git("rev-parse", last).strip() == target:
        print("Changelog already covers the latest main.")
        return

    old_names = {name(line) for line in entries(last)}
    added = [line for line in entries(target) if name(line) not in old_names]
    if not added:
        print("No new resource entries since the last changelog update.")
        return

    server = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    repo = os.environ.get("GITHUB_REPOSITORY", "landscape82/awesome-sound-design-resources")
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    block = f"## {stamp}\n\nChanges: {server}/{repo}/compare/{last[:12]}...{target[:12]}\n\n" + "\n".join(added)
    text = text.replace(START, f"{START}\n{block}", 1)
    open(CHANGELOG, "w", encoding="utf-8").write(set_marker(text))
    print(f"Logged {len(added)} new entr{'y' if len(added) == 1 else 'ies'}.")

if __name__ == "__main__":
    main()
