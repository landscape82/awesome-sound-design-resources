#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { parseReadme, toData } from "./parse-readme.mjs";

const [input = "README.md", output] = process.argv.slice(2);
const parsed = parseReadme(readFileSync(input, "utf8"));
if (parsed.malformed.length) {
  console.error(`${input}: ${parsed.malformed.length} malformed entr${parsed.malformed.length === 1 ? "y" : "ies"} - run npm run validate`);
  process.exit(1);
}
const json = `${JSON.stringify(toData(parsed), null, 2)}\n`;
if (output) {
  writeFileSync(output, json);
  const data = JSON.parse(json);
  console.error(`${output}: ${data.entries.length} entries, ${data.categories.length} categories, ${data.related.length} related lists`);
} else {
  process.stdout.write(json);
}
