import DOMPurify from 'dompurify';
import { marked } from 'marked';

/**
 * Shared by the Text gadget and the help panel, both of which render
 * author-supplied markdown via `marked`. The Angular original bound this
 * through `[innerHTML]`, which Angular's DomSanitizer strips dangerous
 * markup from automatically; React's dangerouslySetInnerHTML has no such
 * built-in sanitization, so this explicitly runs the HTML through
 * DOMPurify before it's ever injected.
 */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
