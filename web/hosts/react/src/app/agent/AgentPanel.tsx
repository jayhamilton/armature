import IconButton from '@mui/material/IconButton';
import { eventService } from '../eventservice/event.service';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import './AgentPanel.css';

/**
 * Ported (shell only) from armature-ui's AgentPanelComponent. The full
 * agent subsystem (agent.service chat loop, a2ui-renderer, mcp-app-viewer/
 * mcp-app.service) is a separate, larger port not yet done — this wires up
 * the panel's open/close event contract so SidenavComponent's mutually-
 * exclusive panel behavior is complete, with placeholder body content.
 */
export function AgentPanel() {
  function close() {
    eventService.emitCloseAgentPanelEvent();
  }

  return (
    <div className="agent-panel">
      <div className="agent-panel-header">
        <span className="agent-panel-title">Agent</span>
        <IconButton className="agent-panel-close" onClick={close} size="small" aria-label="Close agent panel">
          <MatIcon>close</MatIcon>
        </IconButton>
      </div>
      <div className="agent-panel-body">
        <p className="agent-panel-placeholder">
          The agent chat panel (A2UI rendering, MCP app viewer) hasn't been ported to this React build yet.
        </p>
      </div>
    </div>
  );
}
