import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CHANGELOG = resolve(process.cwd(), "../CHANGELOG.md");
const ENTRY = /^- \*\*\[(.+?)\]\((\S+?)\)\*\*(?: [^-]*?)? - (.+)$/;

export function loadChangelog() {
  const items = [];
  let date = null;
  let commit = null;
  for (const line of readFileSync(CHANGELOG, "utf8").split("\n")) {
    const heading = line.match(/^## (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC$/);
    if (heading) {
      date = new Date(`${heading[1]}T${heading[2]}:00Z`);
      commit = null;
      continue;
    }
    const link = line.match(/^Commit: (\S+)$/);
    if (link) {
      commit = link[1];
      continue;
    }
    const entry = line.match(ENTRY);
    if (entry && date) {
      items.push({ name: entry[1], url: entry[2], description: entry[3], date, commit });
    }
  }
  return items.sort((a, b) => b.date - a.date);
}
