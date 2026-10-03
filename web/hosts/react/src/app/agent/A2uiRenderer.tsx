import Button from '@mui/material/Button';
import type { ReactNode } from 'react';
import type { A2uiNode } from '@armature/core';

type NodeRenderer = (node: A2uiNode, onAction: (action: string) => void) => ReactNode;

/**
 * One renderer per A2UI component name, looked up rather than switched on,
 * so a new component kind is one new entry. Deliberately small: the catalog
 * grows only when a real use needs a new kind (today the confirm or cancel
 * gadget card).
 */
const renderers: Record<A2uiNode['component'], NodeRenderer> = {
  Card: (node, onAction) => (
    <div className="a2ui-card">
      {node.children?.map((child, index) => (
        <A2uiRenderer key={index} node={child} onAction={onAction} />
      ))}
    </div>
  ),
  Text: (node) => <p className="a2ui-text">{String(node.props?.['text'] ?? '')}</p>,
  Button: (node, onAction) => (
    <Button
      color={node.props?.['tone'] === 'primary' ? 'primary' : 'inherit'}
      onClick={() => onAction(typeof node.props?.['action'] === 'string' ? node.props['action'] : '')}
    >
      {String(node.props?.['label'] ?? '')}
    </Button>
  ),
};

/** Renders an A2UI component tree (armature-ui's A2uiRendererComponent). */
export function A2uiRenderer({ node, onAction }: { node?: A2uiNode; onAction: (action: string) => void }) {
  if (!node) return null;
  return <>{renderers[node.component]?.(node, onAction)}</>;
}
