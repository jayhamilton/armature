import { Component, ElementRef, ViewChild, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { marked } from 'marked';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { IllustrationMenuComponent } from '../../shared/illustrations/illustration-menu/illustration-menu.component';
import {
  IllustrationOption,
  illustrationSrc,
  IllustrationSize,
  ILLUSTRATION_SIZE_PX,
} from '../../shared/illustrations/illustration-options';

interface ToolbarAction {
  tooltip: string;
  icon?: string;
  label?: string;
  action: () => void;
}

// Markdown authoring control for people unfamiliar with markdown syntax:
// a small toolbar that inserts the right syntax at the cursor (rather than
// requiring it to be memorized/typed by hand), plus a live-rendered preview
// pane next to the raw text so the effect of each edit is immediately
// visible. Deliberately a lightweight/no-dependency step short of a full
// WYSIWYG editor or LLM-assisted authoring — see the "report-style layout"
// project goal for where this fits in the longer roadmap.
@Component({
  selector: 'app-markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MarkdownEditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatIconButton, MatIcon, MatMenu, MatMenuTrigger, MatTooltip, IllustrationMenuComponent]
})
export class MarkdownEditorComponent implements ControlValueAccessor {
  @ViewChild('textareaEl') textareaRef!: ElementRef<HTMLTextAreaElement>;

  value = '';
  disabled = false;
  private onChange = (value: string) => {};
  private onTouched = () => {};

  readonly toolbarActions: ToolbarAction[] = [
    { icon: 'format_bold', tooltip: 'Bold', action: () => this.wrapSelection('**', '**', 'bold text') },
    { icon: 'format_italic', tooltip: 'Italic', action: () => this.wrapSelection('*', '*', 'italic text') },
    { label: 'H1', tooltip: 'Heading 1', action: () => this.linePrefix('# ') },
    { label: 'H2', tooltip: 'Heading 2', action: () => this.linePrefix('## ') },
    { icon: 'format_list_bulleted', tooltip: 'Bulleted list', action: () => this.linePrefix('- ') },
    { icon: 'format_list_numbered', tooltip: 'Numbered list', action: () => this.linePrefix('1. ') },
    { icon: 'format_quote', tooltip: 'Quote', action: () => this.linePrefix('> ') },
    { icon: 'code', tooltip: 'Inline code', action: () => this.wrapSelection('`', '`', 'code') },
    { icon: 'insert_link', tooltip: 'Link', action: () => this.insertLink() },
  ];

  // Size to bake into the next inserted illustration - markdown content is
  // static text once inserted, so unlike the standalone Illustration gadget
  // (which can bind width live) this has to be chosen up front.
  insertSize: IllustrationSize = 'medium';
  readonly illustrationSizes: { value: IllustrationSize; label: string }[] = [
    { value: 'small', label: 'S' },
    { value: 'medium', label: 'M' },
    { value: 'large', label: 'L' },
  ];

  get renderedHtml(): string {
    if (!this.value) return '';
    return marked.parse(this.value, { async: false }) as string;
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.onChange(this.value);
  }

  onBlur(): void {
    this.onTouched();
  }

  private wrapSelection(before: string, after: string, placeholder: string): void {
    const textarea = this.textareaRef.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = this.value.substring(start, end) || placeholder;

    this.replace(start, end, before + selected + after);
    this.focusAndSelect(start + before.length, start + before.length + selected.length);
  }

  private linePrefix(prefix: string): void {
    const textarea = this.textareaRef.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Expand the selection out to the full line(s) it touches, so the
    // prefix applies once per line rather than mid-word.
    const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
    const nextBreak = this.value.indexOf('\n', end);
    const lineEnd = nextBreak === -1 ? this.value.length : nextBreak;

    const isOrdered = prefix === '1. ';
    const newBlock = this.value
      .substring(lineStart, lineEnd)
      .split('\n')
      .map((line, i) => (isOrdered ? `${i + 1}. ${line}` : `${prefix}${line}`))
      .join('\n');

    this.replace(lineStart, lineEnd, newBlock);
    this.focusAndSelect(lineStart, lineStart + newBlock.length);
  }

  private insertLink(): void {
    const textarea = this.textareaRef.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const label = this.value.substring(start, end) || 'link text';
    const url = 'https://';

    this.replace(start, end, `[${label}](${url})`);
    // Select the URL placeholder so it can be typed over immediately.
    const urlStart = start + label.length + 3; // "[" + label + "]("
    this.focusAndSelect(urlStart, urlStart + url.length);
  }

  // Raw <img> rather than markdown's `![alt](src)` syntax, so a width can be
  // baked in - marked passes raw HTML through unsanitized, and Angular's own
  // [innerHTML] sanitizer (see text.component.ts) keeps the width/height
  // attributes even though it strips style attributes, so this is the one
  // reliable way to size an individual inline image from plain text content.
  insertIllustration(option: IllustrationOption): void {
    const textarea = this.textareaRef.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const width = ILLUSTRATION_SIZE_PX[this.insertSize];
    const html = `<img src="${illustrationSrc(option.id)}" alt="${option.label}" width="${width}">`;

    this.replace(start, end, html);
    const cursor = start + html.length;
    this.focusAndSelect(cursor, cursor);
  }

  private replace(start: number, end: number, text: string): void {
    this.value = this.value.substring(0, start) + text + this.value.substring(end);
    this.onChange(this.value);
  }

  // The textarea's [value] binding only reflects `this.value` after the
  // change-detection pass following this click handler runs, so the actual
  // DOM selection has to be set on the next tick.
  private focusAndSelect(start: number, end: number): void {
    setTimeout(() => {
      const textarea = this.textareaRef.nativeElement;
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  }

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
