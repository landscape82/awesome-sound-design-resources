import { loadChangelog } from "../lib/changelog.js";
import { loadData } from "../lib/data.js";

const escape = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plain = (s) => s.replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

export function GET({ site }) {
  const data = loadData();
  const home = new URL(import.meta.env.BASE_URL.replace(/\/?$/, "/"), site).href;
  const items = loadChangelog().slice(0, 50);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(data.title)} - new tools</title>
    <link>${home}</link>
    <atom:link href="${home}rss.xml" rel="self" type="application/rss+xml" />
    <description>${escape(plain(data.tagline))}</description>
    <language>en</language>
${items
  .map(
    (i) => `    <item>
      <title>${escape(i.name)}</title>
      <link>${escape(i.url)}</link>
      <guid isPermaLink="false">${escape(`${i.url}#${i.date.toISOString()}`)}</guid>
      <pubDate>${i.date.toUTCString()}</pubDate>
      <description>${escape(plain(i.description))}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
