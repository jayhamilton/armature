## Text

A block of narrative, markdown-formatted content — for adding commentary, section headings, or story text alongside your charts.

### Configuration

- **Title / Subtitle** — optional; leave blank if this block is meant to read as plain continuing text rather than its own labeled section.
- **Content (Markdown)** — supports standard markdown: `#`/`##`/`###` headings, `**bold**`/`*italic*`, `[links](https://example.com)`, `> blockquotes`, bullet/numbered lists, inline `` `code` ``, fenced code blocks, tables, and images.
- The editor's toolbar has an **Insert illustration** button (image icon) for placing an unDraw illustration inline with the text, instead of typing the image path by hand. Pick a size (S/M/L) before choosing the illustration — the size can't be changed afterward without editing the inserted `<img width="...">` tag directly, since it's baked in at insert time.

### Example

```markdown
## A Section Heading

Some **narrative text** describing what the chart below shows.

- Point one
- Point two

> A pull quote or callout.
```
