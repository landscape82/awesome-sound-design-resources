---
name: Broken link
about: Report (or auto-report) a dead/broken link in the README
title: "Broken link(s) found in README"
labels: broken-link
---

The weekly link-check workflow found one or more broken links in `README.md`.

**Workflow run:** {{ env.RUN_URL }}

Please check the run log above for the specific URL(s) that failed, then either:
- fix/replace the link in `README.md`, or
- remove the entry if the project is no longer available, or
- close this issue if the failure was a false positive (e.g. the site blocks bots) and add it to `.markdown-link-check.json`'s `ignorePatterns` if it'll keep recurring.
