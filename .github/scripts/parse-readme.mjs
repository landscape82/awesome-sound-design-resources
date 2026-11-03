const PRICE = "(?:🆓|💰)";
const PLATFORM = "(?:🖥️|🌐|📱)";
const VARIANT = `${PRICE}(?: ${PLATFORM})*`;
const MARKERS = `${VARIANT}(?: / ${VARIANT})?`;
const ENTRY = new RegExp(`^- \\*\\*\\[(.+?)\\]\\((\\S+?)\\)\\*\\* (${MARKERS}) - (\\S.*[.)])$`);
const UNMARKED_ENTRY = /^- \*\*\[(.+?)\]\((\S+?)\)\*\* - (\S.*[.)])$/;

export const UNMARKED_SECTIONS = new Set(["🔗 Related Lists"]);
export const NON_CATEGORY_SECTIONS = new Set(["Table of contents", "🔗 Related Lists", "🤝 Contributing"]);

const PRICES = { "🆓": "free", "💰": "paid" };
const PLATFORMS = { "🖥️": "desktop", "🌐": "web", "📱": "mobile" };

export const normalizeUrl = (u) =>
  u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

export const slugify = (text) =>
  text.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "").replace(/ /g, "-");

const splitTitle = (text) => {
  const m = text.match(/^(\P{L}+?)\s+(.+)$/u);
  return m && /\p{Extended_Pictographic}/u.test(m[1]) ? { emoji: m[1], name: m[2] } : { emoji: "", name: text };
};

const parseMarkers = (markers) =>
  markers.split(" / ").map((variant) => {
    const [price, ...platforms] = variant.split(" ");
    return { price: PRICES[price], platforms: platforms.map((p) => PLATFORMS[p]) };
  });

export function parseReadme(text) {
  const lines = text.split("\n");
  const headings = [];
  const entries = [];
  const malformed = [];
  let h2 = null;
  let h3 = null;

  lines.forEach((line, i) => {
    const h = line.match(/^(#{1,6}) (.+)$/);
    if (h) {
      const level = h[1].length;
      const title = h[2].trim();
      const heading = { level, title, ...splitTitle(title), slug: slugify(title), line: i };
      headings.push(heading);
      if (level <= 2) {
        h2 = heading;
        h3 = null;
      } else {
        h3 = heading;
      }
      return;
    }
    if (!line.startsWith("- **[")) return;

    const section = (h3 ?? h2)?.title ?? "";
    const unmarked = UNMARKED_SECTIONS.has(section);
    const m = line.match(unmarked ? UNMARKED_ENTRY : ENTRY);
    if (!m) {
      malformed.push({ line: i, section, unmarked });
      return;
    }
    const [, name, url, ...rest] = m;
    const variants = unmarked ? [] : parseMarkers(rest[0]);
    entries.push({
      name,
      url,
      description: rest.at(-1),
      section,
      category: h2?.title ?? "",
      subcategory: h3?.title ?? null,
      variants,
      prices: [...new Set(variants.map((v) => v.price))],
      platforms: [...new Set(variants.flatMap((v) => v.platforms))],
      line: i,
    });
  });

  return { lines, headings, entries, malformed };
}

export function toData(parsed) {
  const categories = [];
  for (const h of parsed.headings) {
    if (h.level === 2 && !NON_CATEGORY_SECTIONS.has(h.title)) {
      categories.push({ title: h.title, emoji: h.emoji, name: h.name, slug: h.slug, subcategories: [] });
    } else if (h.level === 3 && categories.length && categories.at(-1).title === sectionParent(parsed, h)) {
      categories.at(-1).subcategories.push({ title: h.title, emoji: h.emoji, name: h.name, slug: h.slug });
    }
  }
  const strip = ({ line, ...e }) => e;
  return {
    categories,
    entries: parsed.entries.filter((e) => !NON_CATEGORY_SECTIONS.has(e.category)).map(strip),
    related: parsed.entries.filter((e) => UNMARKED_SECTIONS.has(e.category)).map(strip),
  };
}

function sectionParent(parsed, heading) {
  for (let k = parsed.headings.indexOf(heading) - 1; k >= 0; k--) {
    if (parsed.headings[k].level === 2) return parsed.headings[k].title;
  }
  return null;
}
