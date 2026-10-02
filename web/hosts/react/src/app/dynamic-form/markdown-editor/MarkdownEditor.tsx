import { useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { MatIcon } from '../../shared/mat-icon/MatIcon';
import { IllustrationMenu } from '../../shared/illustrations/IllustrationMenu';
import {
  ILLUSTRATION_SIZE_PX,
  illustrationSrc,
  type IllustrationOption,
  type IllustrationSize,
} from '../../shared/illustrations/illustration-options';
import { renderMarkdown } from '../../shared/markdown-prose/renderMarkdown';
import '../../shared/markdown-prose/markdown-prose.css';
import './MarkdownEditor.css';

type ToolbarEdit =
  | { kind: 'wrap'; before: string; after: string; placeholder: string }
  | { kind: 'prefix'; prefix: string }
  | { kind: 'link' };

interface ToolbarAction {
  tooltip: string;
  icon?: string;
  label?: string;
  edit: ToolbarEdit;
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: 'format_bold', tooltip: 'Bold', edit: { kind: 'wrap', before: '**', after: '**', placeholder: 'bold text' } },
  { icon: 'format_italic', tooltip: 'Italic', edit: { kind: 'wrap', before: '*', after: '*', placeholder: 'italic text' } },
  { label: 'H1', tooltip: 'Heading 1', edit: { kind: 'prefix', prefix: '# ' } },
  { label: 'H2', tooltip: 'Heading 2', edit: { kind: 'prefix', prefix: '## ' } },
  { icon: 'format_list_bulleted', tooltip: 'Bulleted list', edit: { kind: 'prefix', prefix: '- ' } },
  { icon: 'format_list_numbered', tooltip: 'Numbered list', edit: { kind: 'prefix', prefix: '1. ' } },
  { icon: 'format_quote', tooltip: 'Quote', edit: { kind: 'prefix', prefix: '> ' } },
  { icon: 'code', tooltip: 'Inline code', edit: { kind: 'wrap', before: '`', after: '`', placeholder: 'code' } },
  { icon: 'insert_link', tooltip: 'Link', edit: { kind: 'link' } },
];

const ILLUSTRATION_SIZES: { value: IllustrationSize; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
];

/**
 * Ported from armature-ui's MarkdownEditorComponent. Markdown authoring for
 * people unfamiliar with markdown syntax: a small toolbar that inserts the
 * right syntax at the cursor, plus a live rendered preview pane next to the
 * raw text so the effect of each edit is visible immediately. A controlled
 * component (`value`, `onChange`) in place of Angular's ControlValueAccessor.
 */
export function MarkdownEditor({ value, onChange }: { value: string | undefined; onChange: (markdown: string) => void }) {
  const text = value ?? '';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [illustrationAnchor, setIllustrationAnchor] = useState<HTMLElement | null>(null);
  // Size to bake into the next inserted illustration: markdown content is
  // static text once inserted, so unlike the standalone Illustration gadget
  // this has to be chosen up front.
  const [insertSize, setInsertSize] = useState<IllustrationSize>('medium');

  function selection(): [number, number] {
    const textarea = textareaRef.current;
    return textarea ? [textarea.selectionStart, textarea.selectionEnd] : [text.length, text.length];
  }

  // The textarea only shows the new value after React re-renders, so the
  // DOM selection is set on the next tick (the same reason Angular's
  // original used setTimeout).
  function replace(start: number, end: number, insert: string, selectStart: number, selectEnd: number) {
    onChange(text.substring(0, start) + insert + text.substring(end));
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(selectStart, selectEnd);
    });
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const [start, end] = selection();
    const selected = text.substring(start, end) || placeholder;
    const selectStart = start + before.length;
    replace(start, end, before + selected + after, selectStart, selectStart + selected.length);
  }

  function linePrefix(prefix: string) {
    const [start, end] = selection();
    // Expand the selection out to the full line(s) it touches, so the
    // prefix applies once per line rather than mid word.
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = text.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? text.length : nextBreak;

    const isOrdered = prefix === '1. ';
    const newBlock = text
      .substring(lineStart, lineEnd)
      .split('\n')
      .map((line, i) => (isOrdered ? `${i + 1}. ${line}` : `${prefix}${line}`))
      .join('\n');

    replace(lineStart, lineEnd, newBlock, lineStart, lineStart + newBlock.length);
  }

  function insertLink() {
    const [start, end] = selection();
    const label = text.substring(start, end) || 'link text';
    const url = 'https://';
    // Select the URL placeholder so it can be typed over immediately.
    const urlStart = start + label.length + 3; // "[" + label + "]("
    replace(start, end, `[${label}](${url})`, urlStart, urlStart + url.length);
  }

  // Raw <img> rather than markdown's `![alt](src)` syntax, so a width can be
  // baked in. DOMPurify (see renderMarkdown) keeps the width attribute.
  function insertIllustration(option: IllustrationOption) {
    const [start, end] = selection();
    const width = ILLUSTRATION_SIZE_PX[insertSize];
    const html = `<img src="${illustrationSrc(option.id)}" alt="${option.label}" width="${width}">`;
    const cursor = start + html.length;
    replace(start, end, html, cursor, cursor);
    setIllustrationAnchor(null);
  }

  function apply(edit: ToolbarEdit) {
    if (edit.kind === 'wrap') wrapSelection(edit.before, edit.after, edit.placeholder);
    else if (edit.kind === 'prefix') linePrefix(edit.prefix);
    else insertLink();
  }

  const renderedHtml = text ? renderMarkdown(text) : '';

  return (
    <div className="markdown-editor">
      <div className="markdown-toolbar">
        {TOOLBAR_ACTIONS.map((item) => (
          <Tooltip key={item.tooltip} title={item.tooltip}>
            <IconButton size="small" aria-label={item.tooltip} onClick={() => apply(item.edit)}>
              {item.icon ? <MatIcon>{item.icon}</MatIcon> : <span className="toolbar-text-icon">{item.label}</span>}
            </IconButton>
          </Tooltip>
        ))}

        <Tooltip title="Insert illustration">
          <IconButton size="small" aria-label="Insert illustration" onClick={(e) => setIllustrationAnchor(e.currentTarget)}>
            <MatIcon>image</MatIcon>
          </IconButton>
        </Tooltip>
        <Popover
          open={illustrationAnchor != null}
          anchorEl={illustrationAnchor}
          onClose={() => setIllustrationAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <div className="illustration-size-row">
            <span className="illustration-size-label">Insert size</span>
            {ILLUSTRATION_SIZES.map((size) => (
              <button
                key={size.value}
                type="button"
                className={'illustration-size-option' + (size.value === insertSize ? ' selected' : '')}
                aria-pressed={size.value === insertSize}
                onClick={() => setInsertSize(size.value)}
              >
                {size.label}
              </button>
            ))}
          </div>
          <IllustrationMenu onPick={insertIllustration} />
        </Popover>
      </div>

      <div className="markdown-panes">
        <textarea
          ref={textareaRef}
          className="markdown-textarea"
          aria-label="Markdown"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write markdown here…"
          spellCheck
        />

        <div className="markdown-preview" role="region" aria-label="Preview">
          {renderedHtml ? (
            <div className="markdown-preview-body markdown-prose" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          ) : (
            <p className="markdown-preview-placeholder">Preview will appear here as you type.</p>
          )}
        </div>
      </div>
    </div>
  );
}
