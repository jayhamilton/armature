import { useMemo } from 'react';
import { GadgetCard } from '../common/gadget-common/GadgetCard';
import { useGadgetConfigMode } from '../common/gadget-common/gadget-base/useGadgetConfigMode';
import { getString } from '../common/gadget-common/gadget-base/gadget.helpers';
import { renderMarkdown } from '../../shared/markdown-prose/renderMarkdown';
import '../../shared/markdown-prose/markdown-prose.css';
import type { GadgetComponentProps } from '../common/gadget-common/gadget-base/gadget-component.types';
import './Text.css';

/**
 * Ported from armature-ui's TextComponent. The Angular original relied on
 * [innerHTML]'s built-in Angular sanitizer; React's dangerouslySetInnerHTML
 * has no such guard, so renderMarkdown() runs the parsed HTML through
 * DOMPurify explicitly (see shared/markdown-prose/renderMarkdown.ts).
 */
export function Text({ gadget, onRemove, onPropertyChange }: GadgetComponentProps) {
  const [inConfig, toggleConfigMode] = useGadgetConfigMode(gadget);

  const content = getString(gadget, 'content');
  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);

  return (
    <GadgetCard
      gadget={gadget}
      onRemove={onRemove}
      onPropertyChange={onPropertyChange}
      inConfig={inConfig}
      onToggleConfigMode={toggleConfigMode}
      helpTopic="text"
    >
      <div className="markdown-prose text-gadget-content" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
    </GadgetCard>
  );
}
