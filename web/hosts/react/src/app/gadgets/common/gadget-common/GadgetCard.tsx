import type { ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { GadgetHeader } from './gadget-header/GadgetHeader';
import type { GadgetComponentProps } from './gadget-base/gadget-component.types';

/**
 * Every armature-ui gadget component's .html was the same boilerplate:
 * `<mat-card cdkDrag><app-gadget-header .../><mat-card-content
 * class="chart-content"><ngx-charts-XXX .../></mat-card-content></mat-card>`.
 * This wraps that shared shell once instead of repeating it in all eleven
 * gadget components — each gadget only supplies its chart/content and
 * helpTopic. `cdkDrag` itself (drag handle for cross-column reordering) is
 * wired up by BoardColumn via @dnd-kit, not here — see board/Board.tsx.
 */
export function GadgetCard({
  gadget,
  onRemove,
  onPropertyChange,
  inConfig,
  onToggleConfigMode,
  helpTopic,
  contentHeight = 380,
  children,
}: GadgetComponentProps & {
  inConfig: boolean;
  onToggleConfigMode: () => void;
  helpTopic: string;
  /** Most gadgets are 380px tall; a few (e.g. Statistic) are shorter. */
  contentHeight?: number;
  children: ReactNode;
}) {
  return (
    // position: relative — Angular Material's mat-card gets this from
    // Material's own base styles, which is what let GadgetHeader's
    // absolutely-positioned help/configure/remove buttons (top/right offsets)
    // anchor to the card itself. MUI's Card doesn't set position by default,
    // so without this those buttons anchor to the nearest positioned
    // ancestor instead — which is .sidenav-root (it needs position:relative
    // of its own, for the nav-collapse edge buttons), putting every gadget's
    // buttons in one stack in the top-right corner of the whole app instead
    // of on their own card.
    <Card sx={{ position: 'relative' }}>
      <GadgetHeader
        title={gadget.title}
        subtitle={gadget.subtitle}
        iconpath={gadget.icon}
        inConfig={inConfig}
        onToggleConfigMode={onToggleConfigMode}
        gadgetInstanceId={gadget.instanceId}
        gadgetPropertyPages={gadget.propertyPages}
        gadgetTags={gadget.tags}
        propertyChangeCallback={onPropertyChange}
        helpTopic={helpTopic}
        onRemove={onRemove}
      />
      <CardContent
        className="chart-content"
        sx={{ height: contentHeight, width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}
      >
        {children}
      </CardContent>
    </Card>
  );
}
