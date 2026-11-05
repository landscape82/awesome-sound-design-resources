#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { normalizeUrl, parseReadme } from "./parse-readme.mjs";

const file = process.argv[2] ?? "README.md";
const text = readFileSync(file, "utf8");
const lines = text.split("\n");

const errors = [];
const fail = (i, msg) => errors.push(`${file}:${i + 1}: ${msg}`);

const { headings: parsedHeadings, entries, malformed } = parseReadme(text);
const headings = parsedHeadings.map((h) => ({ level: h.level, text: h.title, line: h.line }));
const names = new Map();
const urls = new Map();
const sectionsWithEntries = new Set([...entries, ...malformed].sort((a, b) => a.line - b.line).map((e) => e.section));

for (const m of malformed) {
  fail(
    m.line,
    m.unmarked
      ? "entry must look like `- **[Name](url)** - Description.`"
      : "entry must look like `- **[Name](url)** 🆓 🖥️ - Description.` (price marker 🆓/💰 required, optional 🖥️ 🌐 📱, description ending in a period)",
  );
}

let prev = null;
for (const { name, url, section, line: i } of entries) {
  const key = name.toLowerCase();

  if (prev !== null && prev.section === section && key < prev.key) {
    fail(i, `"${name}" is out of alphabetical order in "${section}" (should come before "${prev.name}")`);
  }
  prev = { key, name, section };

  if (names.has(key)) fail(i, `duplicate entry name "${name}" (also on line ${names.get(key) + 1})`);
  else names.set(key, i);

  const nurl = normalizeUrl(url);
  if (urls.has(nurl)) fail(i, `duplicate URL ${url} (also on line ${urls.get(nurl) + 1})`);
  else urls.set(nurl, i);
}

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

const FORM = ".github/ISSUE_TEMPLATE/suggest-resource.yml";
const formLines = readFileSync(FORM, "utf8").split("\n");
const formStart = formLines.findIndex((l) => l.trim() === "id: section");
if (formStart === -1) {
  errors.push(`${FORM}: missing "section" dropdown`);
} else {
  const options = [];
  for (let i = formStart + 1; i < formLines.length && !/^ {4}validations:/.test(formLines[i]); i++) {
    const o = formLines[i].match(/^ {8}- "(.+)"$/);
    if (o && o[1] !== "Other / not sure") options.push(o[1]);
  }
  const sections = [...sectionsWithEntries];
  const missing = sections.filter((s) => !options.includes(s));
  const extra = options.filter((o) => !sections.includes(o));
  if (missing.length) errors.push(`${FORM}: section dropdown is missing ${missing.map((s) => `"${s}"`).join(", ")}`);
  if (extra.length) errors.push(`${FORM}: section dropdown lists ${extra.map((s) => `"${s}"`).join(", ")}, which has no entries in ${file}`);
  if (!missing.length && !extra.length && options.join("\n") !== sections.join("\n")) {
    errors.push(`${FORM}: section dropdown should list sections in README order`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`${file}: ${names.size} entries, ${headings.length} headings - all checks passed.`);
