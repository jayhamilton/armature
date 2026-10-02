// Generates or checks the TypeScript section of docs/patterns/index.md from the TSDoc tags
// @pattern, @role, and @principle in web/packages/*/src (plan, "The generated catalog").
// The Java section is owned by backend PatternCatalogTest; each stack's CI checks its own half.
//
//   node scripts/pattern-catalog.mjs --write   rewrite the section
//   node scripts/pattern-catalog.mjs --check   fail if the section is stale or a pattern has no page
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const packages = join(repo, "web/packages");
const index = join(repo, "docs/patterns/index.md");
const START = "<!-- ts-catalog:start -->";
const END = "<!-- ts-catalog:end -->";

/** Every .ts source file under a directory, excluding tests. */
function sources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return name.endsWith(".ts") && !name.endsWith(".test.ts") ? [path] : [];
  });
}

/** A doc comment (never spanning two) followed by an exported declaration, with its tags. */
const declaration =
  /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*export\s+(?:abstract\s+|async\s+)?(?:class|interface|function\*?|const|type)\s+(\w+)/g;

/** The text of a block tag: its line plus continuation lines, up to the next line starting with @. */
function tag(comment, name) {
  const lines = comment.split("\n").map((line) => line.replace(/^\s*\*\s?/, "").trim());
  const first = lines.findIndex((line) => line.startsWith(`@${name} `));
  if (first < 0) return undefined;
  const rest = lines.slice(first + 1);
  const next = rest.findIndex((line) => line.startsWith("@"));
  return [lines[first].slice(name.length + 2), ...(next < 0 ? rest : rest.slice(0, next))]
    .join(" ")
    .trim();
}

const entries = [];
for (const pkg of readdirSync(packages)) {
  const src = join(packages, pkg, "src");
  if (!existsSync(src)) continue;
  for (const file of sources(src)) {
    for (const [, comment, symbol] of readFileSync(file, "utf8").matchAll(declaration)) {
      const pattern = tag(comment, "pattern");
      if (!pattern) continue;
      entries.push({
        pattern,
        role: tag(comment, "role") ?? "",
        principle: tag(comment, "principle") ?? "",
        symbol,
        path: relative(repo, file),
      });
    }
  }
}
entries.sort((a, b) =>
  [a.pattern, a.role, a.symbol].join("\0").localeCompare([b.pattern, b.role, b.symbol].join("\0")),
);

const table = [
  "| Pattern | Role | Symbol | Principle |",
  "| --- | --- | --- | --- |",
  ...entries.map(
    (e) => `| ${e.pattern} | ${e.role} | [\`${e.symbol}\`](../../${e.path}) | ${e.principle} |`,
  ),
].join("\n");
const generated = `\n${table}\n`;

const text = readFileSync(index, "utf8");
const start = text.indexOf(START);
const end = text.indexOf(END);
if (start < 0 || end < 0) {
  console.error(`Markers ${START} and ${END} not found in ${relative(repo, index)}`);
  process.exit(1);
}
const current = text.slice(start + START.length, end);

// Every tagged pattern must be listed, with an existing page, in the index's pattern table.
const problems = [];
for (const { pattern, symbol } of entries) {
  const row = text.match(new RegExp(`^\\| ${pattern} \\| \\[[^\\]]+\\]\\(([^)]+)\\) \\|$`, "m"));
  if (!row) problems.push(`${symbol}: pattern "${pattern}" has no row in the index's page table`);
  else if (!existsSync(join(dirname(index), row[1])))
    problems.push(`${symbol}: page ${row[1]} for "${pattern}" does not exist`);
}

if (process.argv.includes("--write")) {
  writeFileSync(index, text.slice(0, start + START.length) + generated + text.slice(end));
  console.log(`Wrote ${entries.length} TypeScript catalog entr${entries.length === 1 ? "y" : "ies"}`);
} else if (current !== generated) {
  problems.push("The TypeScript section of docs/patterns/index.md is out of date; run npm run catalog");
}

if (problems.length > 0) {
  problems.forEach((p) => console.error(p));
  process.exit(1);
}
if (!process.argv.includes("--write")) console.log(`TypeScript catalog up to date (${entries.length})`);
