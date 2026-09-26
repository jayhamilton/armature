import { useRef, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { eventService } from '../eventservice/event.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { renderMarkdown } from '../shared/markdown-prose/renderMarkdown';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import '../shared/markdown-prose/markdown-prose.css';
import './HelpPanel.css';

interface IHelpPanelData {
  title: string;
  helpTopic: string;
}

/** Ported from armature-ui's HelpPanelComponent. */
export function HelpPanel() {
  const [gadgetTitle, setGadgetTitle] = useState('');
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  // Guards against a slow-loading fetch for a previous gadget's help topic
  // resolving after the user has already switched to another gadget.
  const requestId = useRef(0);

  useEventEffect(eventService.listenForOpenHelpPanelEvent(), (event) => {
    const data = event.data as IHelpPanelData;
    loadHelp(data.title, data.helpTopic);
  });

  useEventEffect(eventService.listenForCloseHelpPanelEvent(), () => {
    requestId.current++;
    setGadgetTitle('');
    setHasData(false);
    setLoading(false);
    setRenderedHtml('');
  });

  function loadHelp(title: string, helpTopic: string) {
    const thisRequestId = ++requestId.current;
    setGadgetTitle(title);
    setHasData(true);
    setLoading(true);
    setRenderedHtml('');

    fetch(`/assets/help/${helpTopic}.md`)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.text();
      })
      .then((markdown) => {
        if (thisRequestId !== requestId.current) return;
        setRenderedHtml(renderMarkdown(markdown));
        setLoading(false);
      })
      .catch(() => {
        if (thisRequestId !== requestId.current) return;
        setRenderedHtml('');
        setLoading(false);
      });
  }

  function close() {
    eventService.emitCloseHelpPanelEvent();
  }

  return (
    <div className="help-panel">
      <div className="help-panel-header">
        <span className="help-panel-title">Help: {gadgetTitle}</span>
        <IconButton className="help-panel-close" onClick={close} size="small" aria-label="Close help panel">
          <MatIcon>close</MatIcon>
        </IconButton>
      </div>

      {hasData && (
        <div className="help-panel-body">
          {loading ? (
            <p className="help-loading">Loading…</p>
          ) : renderedHtml ? (
            <div className="help-body markdown-prose" dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          ) : (
            <p className="help-loading">No help content is available for this gadget yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
