#!/usr/bin/env node
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "README.md";
const lines = readFileSync(file, "utf8").split("\n");

const PRICE = "(?:🆓|💰)";
const PLATFORM = "(?:🖥️|🌐|📱)";
const MARKERS = `${PRICE}(?: ${PLATFORM})*(?: / ${PRICE}(?: ${PLATFORM})*)?`;
const ENTRY = new RegExp(`^- \\*\\*\\[(.+?)\\]\\((\\S+?)\\)\\*\\* ${MARKERS} - \\S.*[.)]$`);
const UNMARKED_ENTRY = /^- \*\*\[(.+?)\]\((\S+?)\)\*\* - \S.*[.)]$/;
const UNMARKED_SECTIONS = new Set(["🔗 Related Lists"]);

const errors = [];
const fail = (i, msg) => errors.push(`${file}:${i + 1}: ${msg}`);

const normalizeUrl = (u) =>
  u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

const headings = [];
const names = new Map();
const urls = new Map();
let section = "";
let prev = null;

lines.forEach((line, i) => {
  const h = line.match(/^(#{1,6}) (.+)$/);
  if (h) {
    headings.push({ level: h[1].length, text: h[2].trim(), line: i });
    section = h[2].trim();
    prev = null;
    return;
  }
  if (!line.startsWith("- **[")) return;

  const unmarkedAllowed = UNMARKED_SECTIONS.has(section);
  const m = line.match(unmarkedAllowed ? UNMARKED_ENTRY : ENTRY);
  if (!m) {
    fail(
      i,
      unmarkedAllowed
        ? "entry must look like `- **[Name](url)** - Description.`"
        : "entry must look like `- **[Name](url)** 🆓 🖥️ - Description.` (price marker 🆓/💰 required, optional 🖥️ 🌐 📱, description ending in a period)",
    );
    return;
  }
  const [, name, url] = m;
  const key = name.toLowerCase();

  if (prev !== null && key < prev.key) {
    fail(i, `"${name}" is out of alphabetical order in "${section}" (should come before "${prev.name}")`);
  }
  prev = { key, name };

  if (names.has(key)) fail(i, `duplicate entry name "${name}" (also on line ${names.get(key) + 1})`);
  else names.set(key, i);

  const nurl = normalizeUrl(url);
  if (urls.has(nurl)) fail(i, `duplicate URL ${url} (also on line ${urls.get(nurl) + 1})`);
  else urls.set(nurl, i);
});

const tocStart = lines.findIndex((l) => l === "## Table of contents");
if (tocStart === -1) {
  errors.push(`${file}: missing "## Table of contents" section`);
} else {
  const toc = [];
  for (let i = tocStart + 1; i < lines.length && !lines[i].startsWith("#"); i++) {
    const t = lines[i].match(/^( *)- \[(.+?)\]\(#[^)]*\)$/);
    if (t) toc.push({ depth: t[1].length / 2, text: t[2].replace(/\\&/g, "&"), line: i });
    else if (lines[i].trim()) fail(i, "unexpected line in table of contents");
  }
  const expected = headings.map((h) => ({ depth: h.level - 1, text: h.text, line: h.line }));
  const len = Math.max(toc.length, expected.length);
  for (let k = 0; k < len; k++) {
    const got = toc[k];
    const want = expected[k];
    if (!want) {
      fail(got.line, `table of contents lists "${got.text}" but there is no such heading`);
      break;
    }
    if (!got) {
      fail(want.line, `heading "${want.text}" is missing from the table of contents`);
      break;
    }
    if (got.text !== want.text || got.depth !== want.depth) {
      fail(got.line, `table of contents entry "${got.text}" (depth ${got.depth}) should be "${want.text}" (depth ${want.depth}) to match the headings`);
      break;
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`${file}: ${names.size} entries, ${headings.length} headings - all checks passed.`);
