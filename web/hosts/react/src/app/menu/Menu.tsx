import { useEffect, useState } from 'react';
import AppBar from '@mui/material/AppBar';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import { useNavigate } from 'react-router-dom';
import { environment } from 'src/environments/environment';
import { appConfigService } from '../app-config/app-config.service';
import { boardService } from '../board/board.service';
import { eventService } from '../eventservice/event.service';
import { themeService } from '../theme/theme.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { useObservableValue } from 'src/lib/useObservable';
import { Configuration } from '../configuration/Configuration';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { TuneTwoRailIcon } from '../shared/icons/TuneTwoRailIcon';
import { BoardType, type IBoard } from '../board/board.model';
import './Menu.css';

/** Ported from armature-ui's MenuComponent (the top toolbar). */
export function Menu() {
  const navigate = useNavigate();
  const [boardExists, setBoardExists] = useState(false);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const locked = useObservableValue(boardService.locked$, () => boardService.isLocked());
  const isDark = useObservableValue(themeService.isDark$, () => themeService.isDark);
  const appTitle = useObservableValue(appConfigService.appTitle$, () => appConfigService.appTitle);

  function refreshBoardExists() {
    boardService.getLastSelectedBoard().subscribe((board: IBoard) => {
      setBoardExists(board?.id !== BoardType.EMPTYBOARDCOLLECTION);
    });
  }

  useEffect(() => {
    refreshBoardExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEventEffect(eventService.listenForBoardCreatedCompleteEvent(), () => refreshBoardExists());
  useEventEffect(eventService.listenForBoardDeletedCompleteEvent(), () => refreshBoardExists());
  useEventEffect(eventService.listenForCloseAgentPanelEvent(), () => setAgentPanelOpen(false));

  function toggleLibraryPanel() {
    eventService.emitLibraryMenuOpenEvent();
  }

  function toggleMenu() {
    eventService.emitBoardMenuSideNavClickEvent();
  }

  function toggleLayout() {
    eventService.emitBoardSideLayoutClickEvent();
  }

  function toggleAgentPanel() {
    if (agentPanelOpen) {
      eventService.emitCloseAgentPanelEvent();
      setAgentPanelOpen(false);
      return;
    }
    setAgentPanelOpen(true);
    eventService.emitOpenAgentPanelEvent();
  }

  function toggleLocked() {
    boardService.toggleLocked();
  }

  function logout() {
    sessionStorage.removeItem(environment.sessionToken);
    navigate('/login');
  }

  return (
    <>
      <AppBar position="static" className="app-toolbar">
        <Toolbar>
          {boardExists && (
            <Tooltip title="Open board menu">
              <IconButton className="example-icon" aria-label="Open board menu" onClick={toggleMenu}>
                <MatIcon>menu</MatIcon>
              </IconButton>
            </Tooltip>
          )}

          <span className="app-title">{appTitle}</span>
          <span className="example-spacer" />

          {!locked && (
            <Tooltip title="Board settings">
              <IconButton className="example-icon config-toggle-icon" aria-label="Board settings" onClick={() => setConfigOpen(true)}>
                <TuneTwoRailIcon />
              </IconButton>
            </Tooltip>
          )}

          {!locked && (
            <Tooltip title={boardExists ? 'Gadget library' : 'Create a board first'}>
              <span>
                <IconButton disabled={!boardExists} aria-label="Gadget library" onClick={toggleLibraryPanel}>
                  <MatIcon>playlist_add</MatIcon>
                </IconButton>
              </span>
            </Tooltip>
          )}

          {!locked && (
            <Tooltip title={boardExists ? 'Board layout' : 'Create a board first'}>
              <span>
                <IconButton disabled={!boardExists} className="example-icon favorite-icon" aria-label="Board layout" onClick={toggleLayout}>
                  <MatIcon>dashboard</MatIcon>
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title={boardExists ? (locked ? 'Unlock board' : 'Lock board') : 'Create a board first'}>
            <span>
              <IconButton
                disabled={!boardExists}
                className="example-icon"
                aria-label={locked ? 'Unlock board' : 'Lock board'}
                onClick={toggleLocked}
              >
                <MatIcon>{locked ? 'lock' : 'lock_open'}</MatIcon>
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title={agentPanelOpen ? 'Close assistant' : 'Open assistant'}>
            <IconButton
              className="example-icon"
              aria-label={agentPanelOpen ? 'Close assistant' : 'Open assistant'}
              onClick={toggleAgentPanel}
            >
              <MatIcon>auto_awesome</MatIcon>
            </IconButton>
          </Tooltip>

          <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              className="example-icon"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={() => themeService.toggleTheme()}
            >
              <MatIcon>{isDark ? 'light_mode' : 'dark_mode'}</MatIcon>
            </IconButton>
          </Tooltip>

          <Tooltip title="Log out">
            <IconButton className="example-icon favorite-icon" style={{ marginLeft: 20 }} aria-label="Log out" onClick={logout}>
              <MatIcon>logout</MatIcon>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Configuration open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}
