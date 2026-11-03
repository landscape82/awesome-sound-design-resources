import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseReadme, toData } from "../../../.github/scripts/parse-readme.mjs";

const README = resolve(process.cwd(), "../README.md");
const REPO = "https://github.com/landscape82/awesome-sound-design-resources";

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const inline = (text) =>
  escape(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) =>
      href.startsWith("#")
        ? `<a href="${href}">${label}</a>`
        : `<a href="${href}" target="_blank" rel="noopener">${label}</a>`,
    );

export const host = (url) => new URL(url).hostname.replace(/^www\./, "");

export function loadData() {
  const text = readFileSync(README, "utf8");
  const parsed = parseReadme(text);
  if (parsed.malformed.length) {
    throw new Error(`README.md has ${parsed.malformed.length} malformed entries - run npm run validate`);
  }
  const data = toData(parsed);
  const title = parsed.headings.find((h) => h.level === 1);
  const tagline = text.split("\n").find((l) => l.startsWith("> "))?.slice(2) ?? "";

  const categories = data.categories.map((c) => {
    const own = data.entries.filter((e) => e.category === c.title && !e.subcategory);
    const subcategories = c.subcategories.map((s) => ({
      ...s,
      entries: data.entries.filter((e) => e.subcategory === s.title),
    }));
    return { ...c, entries: own, subcategories, count: own.length + subcategories.reduce((n, s) => n + s.entries.length, 0) };
  });

  return {
    repo: REPO,
    title: title?.name ?? "Awesome Sound Design resources",
    emoji: title?.emoji ?? "🎧",
    tagline,
    categories,
    related: data.related,
    total: data.entries.length,
  };
}
