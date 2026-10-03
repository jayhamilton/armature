import { useEffect, useRef, useState } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { appConfigService } from '../app-config/app-config.service';
import { boardService } from '../board/board.service';
import { eventService } from '../eventservice/event.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { useObservableValue } from 'src/lib/useObservable';
import { AgentPanel } from '../agent/AgentPanel';
import { Board } from '../board/Board';
import { ConfigPanel } from '../config-panel/ConfigPanel';
import { HelpPanel } from '../help-panel/HelpPanel';
import { Layout } from '../layout/Layout';
import { Library } from '../library/Library';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { Hiearchy, type IBoard, type IBoardCollection } from '../board/board.model';
import './Sidenav.css';

type PanelName = 'layout' | 'config' | 'library' | 'help' | 'agent' | null;
type NavState = 'expanded' | 'icon' | 'hidden';

/**
 * Ported from armature-ui's SidenavComponent. The Angular original needed
 * five nested mat-drawer-containers because Material doesn't allow two
 * mat-drawers at the same position in one container — every panel here
 * (layout/config/library/help/agent) instead reads from one `openPanel`
 * state value, which gives "opening one closes the others" for free
 * instead of the original's explicit close-the-other-four calls at every
 * open site.
 */
export function Sidenav() {
  const [boardData, setBoardData] = useState<IBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [navState, setNavState] = useState<NavState>('expanded');
  const [openPanel, setOpenPanel] = useState<PanelName>(null);
  const libraryCollapsed = useObservableValue(
    appConfigService.libraryPanelCollapsed$,
    () => appConfigService.libraryPanelCollapsed
  );

  const lastVisibleNavState = useRef<'expanded' | 'icon'>('expanded');
  const openConfigInstanceId = useRef(-1);
  const previousOpenPanel = useRef<PanelName>(null);

  function loadBoards() {
    boardService.getBoardCollection().subscribe((boardCollection: IBoardCollection) => {
      const parents = boardCollection.boardList.filter((b) => b.relationship === Hiearchy.PARENT);
      setBoardData(parents);

      if (parents.length === 0) {
        setOpenPanel(null);
      }
    });

    boardService.getLastSelectedBoard().subscribe((board) => {
      setSelectedBoardId((current) => current ?? (board && board.id != null ? board.id : current));
    });
  }

  useEffect(() => {
    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The single reliable "the config panel actually finished closing" signal
  // — fires whether it closed via its own close button, opening a different
  // panel, or the board list becoming empty.
  useEffect(() => {
    if (previousOpenPanel.current === 'config' && openPanel !== 'config') {
      eventService.emitConfigPanelClosedEvent({ data: { instanceId: openConfigInstanceId.current } });
    }
    previousOpenPanel.current = openPanel;
  }, [openPanel]);

  function toggleMenu() {
    setNavState((current) => {
      const next = current === 'hidden' ? lastVisibleNavState.current : current === 'expanded' ? 'icon' : 'expanded';
      lastVisibleNavState.current = next;
      return next;
    });
  }

  function collapseNav() {
    setNavState((current) => {
      if (current !== 'hidden') lastVisibleNavState.current = current;
      return 'hidden';
    });
  }

  function expandNav() {
    setNavState(lastVisibleNavState.current);
  }

  function togglePanel(panel: Exclude<PanelName, null>) {
    setOpenPanel((current) => (current === panel ? null : panel));
  }

  function selectBoard(boardId: number) {
    setSelectedBoardId(boardId);
    eventService.emitBoardSelectedEvent({ data: boardId });
  }

  useEventEffect(eventService.listenForBoardMenuSideNavClickEvent(), () => toggleMenu());
  useEventEffect(eventService.listenForBoardSideLayoutEvent(), () => togglePanel('layout'));

  useEventEffect(eventService.listenForOpenConfigPanelEvent(), (event) => {
    openConfigInstanceId.current = event.data.instanceId;
    setOpenPanel('config');
  });
  useEventEffect(eventService.listenForCloseConfigPanelEvent(), () => {
    setOpenPanel((current) => (current === 'config' ? null : current));
  });

  useEventEffect(eventService.listenForLibraryOpenMenuEvent(), () => togglePanel('library'));
  useEventEffect(eventService.listenForCloseLibraryPanelEvent(), () => {
    setOpenPanel((current) => (current === 'library' ? null : current));
  });

  useEventEffect(eventService.listenForOpenHelpPanelEvent(), () => setOpenPanel('help'));
  useEventEffect(eventService.listenForCloseHelpPanelEvent(), () => {
    setOpenPanel((current) => (current === 'help' ? null : current));
  });

  useEventEffect(eventService.listenForOpenAgentPanelEvent(), () => setOpenPanel('agent'));
  useEventEffect(eventService.listenForCloseAgentPanelEvent(), () => {
    setOpenPanel((current) => (current === 'agent' ? null : current));
  });

  useEventEffect(eventService.listenForBoardCreatedCompleteEvent(), () => loadBoards());
  useEventEffect(eventService.listenForBoardDeletedCompleteEvent(), () => loadBoards());
  useEventEffect(eventService.listenForBoardUpdateNameDescriptionRequestEvent(), () => loadBoards());
  useEventEffect(eventService.listenForBoardSelectedEvent(), (event) => setSelectedBoardId(event.data));

  const navExpanded = navState === 'expanded';
  const navRailWidthPx = navState === 'expanded' ? 220 : 64;

  return (
    <div className="sidenav-root">
      {boardData.length > 0 &&
        (navState === 'hidden' ? (
          <Tooltip title="Show menu" placement="right">
            <button
              type="button"
              className="nav-edge-toggle nav-reveal"
              onClick={expandNav}
              aria-label="Show board menu"
            >
              <MatIcon>chevron_right</MatIcon>
            </button>
          </Tooltip>
        ) : (
          <Tooltip title="Collapse menu" placement="right">
            <button
              type="button"
              className="nav-edge-toggle nav-collapse"
              style={{ left: navRailWidthPx }}
              onClick={collapseNav}
              aria-label="Collapse board menu"
            >
              <MatIcon>chevron_left</MatIcon>
            </button>
          </Tooltip>
        ))}

      {boardData.length > 0 && (
        <nav
          className={[
            'example-sidenav',
            navState === 'icon' ? 'collapsed' : '',
            navState === 'hidden' ? 'hidden' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <ul className="nav-list">
            {boardData.map((board) => (
              <Tooltip key={board.id} title={board.title} placement="right" disableHoverListener={navExpanded}>
                <li
                  className={board.id === selectedBoardId ? 'active' : ''}
                  aria-current={board.id === selectedBoardId ? 'page' : undefined}
                  onClick={() => selectBoard(board.id)}
                >
                  <MatIcon className="nav-item-icon">{board.icon || 'dashboard'}</MatIcon>
                  {navExpanded && <span className="nav-item-label">{board.title}</span>}
                </li>
              </Tooltip>
            ))}
          </ul>
        </nav>
      )}

      <div className="example-sidenav-content">
        <Board />
      </div>

      {/*
        Every panel below is a mat-drawer position="end" in the Angular
        original, nested so the board sits between the nav rail and
        whichever panel is open — i.e. panels dock to the right edge of the
        screen, not the left. DOM order here (after .example-sidenav-content,
        not before) is what makes that true in a plain flex row: the open
        panel is the flex item closest to the right edge, same as the
        nesting order layout > config > library > help > agent put agent
        closest to the true right edge in the original.
      */}
      <div className={['side-panel-slot', openPanel === 'layout' ? 'open' : ''].filter(Boolean).join(' ')}>
        <Layout />
      </div>

      <div className={['side-panel-slot', openPanel === 'config' ? 'open' : ''].filter(Boolean).join(' ')}>
        <ConfigPanel />
      </div>

      <div
        className={[
          'side-panel-slot',
          openPanel === 'library' ? 'open' : '',
          libraryCollapsed ? 'library-collapsed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Library />
      </div>

      <div className={['side-panel-slot', openPanel === 'help' ? 'open' : ''].filter(Boolean).join(' ')}>
        <HelpPanel />
      </div>

      <div className={['side-panel-slot', openPanel === 'agent' ? 'open' : ''].filter(Boolean).join(' ')}>
        <AgentPanel />
      </div>
    </div>
  );
}
