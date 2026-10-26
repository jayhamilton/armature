// Copies the gadget help pages from docs/help/gadgets (their one home, INC-01a) into a host's
// static assets, where its help panel fetches assets/help/<slug>.md. The copy is git ignored.
//
// Usage, from a host directory: node ../copy-gadget-help.mjs <destination>
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const destination = process.argv[2];
if (!destination) {
  console.error('usage: node ../copy-gadget-help.mjs <destination>');
  process.exit(1);
}

const source = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/help/gadgets');
const target = resolve(process.cwd(), destination);

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
const pages = readdirSync(source).filter((name) => name.endsWith('.md'));
for (const page of pages) {
  cpSync(join(source, page), join(target, page));
}
console.log(`Copied ${pages.length} gadget help pages to ${destination}`);
