import { useEffect, useRef, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { appConfigService } from '../app-config/app-config.service';
import { eventService } from '../eventservice/event.service';
import { useObservableValue } from 'src/lib/useObservable';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { libraryService } from './library.service';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import './Library.css';

const COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD', '#E74C3C',
  '#3498DB', '#2ECC71', '#1ABC9C', '#9B59B6', '#34495E', '#16A085',
  '#F39C12', '#D35400', '#C0392B', '#7F8C8D', '#BDC3C7', '#95A5A6',
  '#2980B9', '#27AE60', '#8E44AD', '#2C3E50', '#F4D03F', '#E67E22',
  '#D35400', '#1ABC9C', '#2ECC71', '#E74C3C', '#9B59B6', '#34495E',
];

/**
 * Ported from armature-ui's LibraryComponent. CdkVirtualScrollViewport's
 * measure-inside-an-animating-drawer workaround doesn't carry over — the
 * library here is a plain scrolling list rather than a virtualized one
 * (library.json holds ~11 gadgets, well within "just render them all").
 */
export function Library() {
  const [library, setLibrary] = useState<IGadget[]>([]);
  const collapsed = useObservableValue(
    appConfigService.libraryPanelCollapsed$,
    () => appConfigService.libraryPanelCollapsed
  );
  const lastAddTime = useRef(0);

  useEffect(() => {
    libraryService.getLibrary().subscribe((libraryData) => {
      setLibrary([...libraryData].sort((a, b) => a.title.localeCompare(b.title)));
    });
  }, []);

  function addGadget(gadgetData: IGadget) {
    const now = Date.now();
    if (now - lastAddTime.current < 1000) return;
    lastAddTime.current = now;
    eventService.emitLibraryAddGadgetEvent({ data: gadgetData });
  }

  function close() {
    eventService.emitCloseLibraryPanelEvent();
  }

  function toggleCollapsed() {
    appConfigService.toggleLibraryPanelCollapsed();
  }

  return (
    <div className="library-panel">
      <div className={['library-panel-header', collapsed ? 'collapsed' : ''].filter(Boolean).join(' ')}>
        {!collapsed && <span className="library-panel-title">Add Tool ({library.length})</span>}
        <div className="library-panel-header-actions">
          <Tooltip title={collapsed ? 'Expand' : 'Collapse'} placement="left">
            <IconButton
              className="library-panel-header-btn"
              onClick={toggleCollapsed}
              size="small"
              aria-label={collapsed ? 'Expand gadget library panel' : 'Collapse gadget library panel'}
            >
              <MatIcon>{collapsed ? 'chevron_left' : 'chevron_right'}</MatIcon>
            </IconButton>
          </Tooltip>
          <IconButton
            className="library-panel-header-btn library-panel-close"
            onClick={close}
            size="small"
            aria-label="Close gadget library panel"
          >
            <MatIcon>close</MatIcon>
          </IconButton>
        </div>
      </div>

      <div className="library-panel-body">
        {collapsed ? (
          <div className="library-icon-rail">
            {library.map((gadget, index) => (
              <Tooltip key={gadget.componentType} title={gadget.title} placement="left">
                <IconButton
                  className="library-icon-button"
                  onClick={() => addGadget(gadget)}
                  aria-label={`Add ${gadget.title}`}
                >
                  <MatIcon style={{ color: COLORS[index % COLORS.length] }}>{gadget.icon}</MatIcon>
                </IconButton>
              </Tooltip>
            ))}
          </div>
        ) : (
          <div className="library-viewport">
            {library.map((gadget, index) => (
              <Card
                key={gadget.componentType}
                className="library-card"
                style={{ borderTopColor: COLORS[index % COLORS.length] }}
              >
                <Tooltip title={`Add ${gadget.title}`}>
                  <IconButton
                    className="library-card-add-btn"
                    onClick={() => addGadget(gadget)}
                    aria-label={`Add ${gadget.title}`}
                    size="small"
                  >
                    <MatIcon>{gadget.actions?.[0]?.name ?? 'add'}</MatIcon>
                  </IconButton>
                </Tooltip>
                <CardHeader
                  avatar={<MatIcon className="library-icon">{gadget.icon}</MatIcon>}
                  title={gadget.title}
                  subheader={gadget.subtitle}
                />
                <CardContent>{gadget.description}</CardContent>
                {gadget.tags.length > 0 && (
                  <div className="library-card-tags">
                    {gadget.tags.map((tag) => (
                      <span key={tag.name} className="tag-pill">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
