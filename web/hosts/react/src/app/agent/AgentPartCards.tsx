import Button from '@mui/material/Button';
import type { ReactNode } from 'react';
import { parsePayload, type A2uiNode } from '@armature/core';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { A2uiRenderer } from './A2uiRenderer';
import { McpAppViewer } from './McpAppViewer';
import type { PartCardProps } from './partCardRegistry';

// One card per kind of ui part, registered by key in partCardRegistry.ts.
// Text and labels match the Angular host's panel, so one conformance test
// reads both hosts.

function ComponentCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="agent-panel-component-card">
      <div className="agent-panel-component-label">{label}</div>
      {children}
    </div>
  );
}

function GadgetPreview({ gadget, subtitle }: { gadget: IGadget; subtitle?: string }) {
  return (
    <div className="agent-panel-gadget-preview">
      <MatIcon>{gadget.icon}</MatIcon>
      <div>
        <div className="agent-panel-gadget-title">{gadget.title}</div>
        {subtitle && <div className="agent-panel-gadget-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

function Applied({ children }: { children: ReactNode }) {
  return <span className="agent-panel-applied-badge">{children}</span>;
}

export function TextPart({ part }: PartCardProps) {
  return <p>{part.text}</p>;
}

export function BoardListCard({ part, onSwitchBoard }: PartCardProps) {
  return (
    <ComponentCard label="Your boards">
      {part.boardSummaries?.length ? (
        <ul className="agent-panel-board-list">
          {part.boardSummaries.map((board) => (
            <li key={board.id}>
              <span>{board.title}</span>
              <Button onClick={() => onSwitchBoard(board.id)}>Switch</Button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No boards found yet.</p>
      )}
    </ComponentCard>
  );
}

export function GadgetMoveCard({ part }: PartCardProps) {
  return (
    <ComponentCard label="Move gadget">
      {part.gadgetMoveTarget ? (
        <>
          <GadgetPreview gadget={part.gadgetMoveTarget} subtitle={`Move ${part.direction}`} />
          <Applied>Moved {part.direction} ✓</Applied>
        </>
      ) : (
        <p>Couldn't find a gadget matching "{part.gadgetMoveQuery}" on this board.</p>
      )}
    </ComponentCard>
  );
}

export function GadgetRemoveCard({ part }: PartCardProps) {
  return (
    <ComponentCard label="Remove gadget">
      {part.gadgetRemoveTarget ? (
        <>
          <GadgetPreview gadget={part.gadgetRemoveTarget} />
          <Applied>Removed ✓</Applied>
        </>
      ) : (
        <p>Couldn't find a gadget matching "{part.gadgetRemoveQuery}" on this board.</p>
      )}
    </ComponentCard>
  );
}

export function RowAddCard() {
  return (
    <ComponentCard label="Add row">
      <Applied>Row added ✓</Applied>
    </ComponentCard>
  );
}

export function RowLayoutCard({ part }: PartCardProps) {
  return (
    <ComponentCard label="Row layout">
      {part.rowLayoutApplied ? (
        <Applied>
          Row {(part.rowIndex ?? 0) + 1} set to {part.rowStructure} ✓
        </Applied>
      ) : (
        <p>Couldn't find row {(part.rowIndex ?? 0) + 1} on this board.</p>
      )}
    </ComponentCard>
  );
}

export function GadgetSuggestionCard({ part }: PartCardProps) {
  return (
    <ComponentCard label="Suggested gadget">
      {part.gadgetPreview ? (
        <>
          <GadgetPreview gadget={part.gadgetPreview} subtitle={part.gadgetPreview.subtitle} />
          <Applied>Added ✓</Applied>
        </>
      ) : (
        <p>This gadget type isn't in the library.</p>
      )}
    </ComponentCard>
  );
}

/** Previews a gadget and adds it only when the user confirms on the card. */
export function A2uiCard({ part, onA2uiAction }: PartCardProps) {
  return (
    <ComponentCard label="Suggested gadget">
      {part.gadgetPreview ? (
        <GadgetPreview gadget={part.gadgetPreview} subtitle={part.gadgetPreview.subtitle} />
      ) : (
        <p>This gadget type isn't in the library.</p>
      )}
      {!part.a2uiResolution ? (
        <A2uiRenderer
          node={parsePayload(part)?.['ui'] as A2uiNode | undefined}
          onAction={(action) => onA2uiAction(part, action)}
        />
      ) : (
        <Applied>{part.a2uiResolution === 'confirmed' ? 'Added ✓' : 'Dismissed'}</Applied>
      )}
    </ComponentCard>
  );
}

export function IframeCard({ part }: PartCardProps) {
  return (
    <div className="agent-panel-iframe-card">
      <div className="agent-panel-component-label">{part.title}</div>
      <iframe src={part.src} title={part.title} />
    </div>
  );
}

export function McpAppCard({ part }: PartCardProps) {
  const toolName = parsePayload(part)?.['toolName'];
  return typeof toolName === 'string' ? <McpAppViewer toolName={toolName} /> : null;
}
