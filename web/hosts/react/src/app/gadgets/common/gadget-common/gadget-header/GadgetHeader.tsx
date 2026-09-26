import { useEffect, useRef, useState } from 'react';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { animationService } from 'src/app/animation/animation.service';
import { boardService } from 'src/app/board/board.service';
import { eventService } from 'src/app/eventservice/event.service';
import { useObservableValue } from 'src/lib/useObservable';
import { useEventEffect } from 'src/lib/useEventEffect';
import { ConfirmDialog } from 'src/app/shared/confirm-dialog/ConfirmDialog';
import { MatIcon } from 'src/app/shared/mat-icon/MatIcon';
import { TuneTwoRailIcon } from 'src/app/shared/icons/TuneTwoRailIcon';
import { useDragHandle } from 'src/app/board/DragHandleContext';
import type { IPropertyPage, ITag } from '../gadget-base/gadget.model';
import './GadgetHeader.css';

export interface GadgetHeaderProps {
  title: string;
  subtitle: string;
  iconpath: string;
  inConfig: boolean;
  onToggleConfigMode: () => void;
  gadgetInstanceId: number;
  gadgetPropertyPages: IPropertyPage[];
  gadgetTags: ITag[];
  propertyChangeCallback: ((propertiesJSON: string) => void) | null;
  /** Slug matching a file under public/assets/help/<helpTopic>.md, rendered in the help panel. */
  helpTopic?: string;
  onRemove: () => void;
}

/**
 * Ported from armature-ui's GadgetHeaderComponent. `inConfig` is owned by
 * the calling gadget component (as React state) rather than by this
 * component itself, matching the original's [inConfig] Input /
 * (toggleConfigModeEvent) Output binding pair.
 */
export function GadgetHeader({
  title,
  subtitle,
  iconpath,
  inConfig,
  onToggleConfigMode,
  gadgetInstanceId,
  gadgetPropertyPages,
  gadgetTags,
  propertyChangeCallback,
  helpTopic = '',
  onRemove,
}: GadgetHeaderProps) {
  const [menuLabel, setMenuLabel] = useState(inConfig ? 'Exit Configuration' : 'Configure');
  const locked = useObservableValue(boardService.locked$, () => boardService.isLocked());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragHandle = useDragHandle();
  const setHeaderRef = (element: HTMLDivElement | null) => {
    headerRef.current = element;
    dragHandle?.setActivatorNodeRef(element);
  };

  // The panel can close for reasons other than this gadget's own menu (its
  // close button, backdrop click, escape key, or opening another side
  // panel) — this is the single place that keeps inConfig in sync with the
  // panel actually being closed.
  useEventEffect(eventService.listenForConfigPanelClosedEvent(), (event) => {
    if (inConfig && event.data.instanceId === gadgetInstanceId) {
      setMenuLabel('Configure');
      onToggleConfigMode();
    }
  });

  // Locking mid-edit shouldn't leave a gadget stuck in configuration mode
  // with no menu item left to exit it — force it closed the moment the
  // board locks.
  useEffect(() => {
    if (locked && inConfig) {
      toggleConfigMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  // Gadgets already placed on a board before the icon field switched from an
  // image path to a Material icon ligature name still have the old path
  // persisted in their saved instance data. Rendering a path string as an
  // icon ligature shows nothing usable, so fall back to a generic icon for
  // anything that doesn't look like a plain ligature name.
  const displayIcon = !iconpath || /[/.]/.test(iconpath) ? 'widgets' : iconpath;

  function toggleConfigMode() {
    const next = menuLabel === 'Configure' ? 'Exit Configuration' : 'Configure';
    setMenuLabel(next);
    if (next === 'Configure') {
      eventService.emitBoardGadgetPropertyChangeEvent();
    }
    onToggleConfigMode();

    if (next === 'Exit Configuration') {
      // Just entered config mode — open the side panel.
      eventService.emitOpenConfigPanelEvent({
        data: {
          title,
          instanceId: gadgetInstanceId,
          propertyPages: gadgetPropertyPages,
          tags: gadgetTags,
          propertyChangeCallback,
        },
      });
    } else {
      // Just exited config mode via this gadget's own menu — close it.
      eventService.emitCloseConfigPanelEvent();
    }
  }

  function openHelp() {
    eventService.emitOpenHelpPanelEvent({ data: { title, helpTopic } });
  }

  function requestRemove() {
    setConfirmOpen(true);
  }

  async function confirmRemove() {
    setConfirmOpen(false);
    // Every gadget renders its header inside its own card, so this is the
    // one place that can fade the whole card out for all gadget types
    // without touching each gadget component.
    const card = headerRef.current?.closest('.MuiCard-root') as HTMLElement | null;
    if (!card) {
      onRemove();
      return;
    }
    await animationService.gadgetLeave(card);
    onRemove();
  }

  return (
    <>
      <CardHeader
        ref={setHeaderRef}
        {...dragHandle?.attributes}
        {...dragHandle?.listeners}
        className="gadget-header move-cursor"
        avatar={!locked ? <MatIcon className="gadget-icon">{displayIcon}</MatIcon> : undefined}
        title={title}
        subheader={subtitle}
        action={
          !locked && (
            <>
              <Tooltip title="Help">
                <IconButton className="help-button" aria-label="Help" onClick={openHelp} size="small">
                  <MatIcon>chat_bubble_outline</MatIcon>
                </IconButton>
              </Tooltip>
              <Tooltip title={menuLabel}>
                <IconButton
                  className="configure-button"
                  aria-label={menuLabel}
                  onClick={toggleConfigMode}
                  size="small"
                >
                  <TuneTwoRailIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Remove">
                <IconButton
                  className="remove-button"
                  aria-label="Remove"
                  onClick={requestRemove}
                  size="small"
                >
                  <MatIcon>close</MatIcon>
                </IconButton>
              </Tooltip>
            </>
          )
        }
      />
      {inConfig && <div className="config-mode-indicator">Configuration Mode</div>}

      <ConfirmDialog
        open={confirmOpen}
        data={{
          title: 'Remove Gadget',
          message: `Remove "${title}" from the dashboard?`,
          confirmLabel: 'Remove',
        }}
        onConfirm={confirmRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
