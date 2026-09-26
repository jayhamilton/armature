import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { eventService } from '../eventservice/event.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { DynamicForm } from '../dynamic-form/DynamicForm';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import type { IPropertyPage, ITag } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import './ConfigPanel.css';

interface IConfigPanelData {
  title: string;
  instanceId: number;
  propertyPages: IPropertyPage[];
  tags: ITag[];
  propertyChangeCallback: ((propertiesJSON: string) => void) | null;
}

const EMPTY_DATA: IConfigPanelData = {
  title: '',
  instanceId: -1,
  propertyPages: [],
  tags: [],
  propertyChangeCallback: null,
};

/** Ported from armature-ui's ConfigPanelComponent. */
export function ConfigPanel() {
  const [data, setData] = useState<IConfigPanelData>(EMPTY_DATA);
  const [hasData, setHasData] = useState(false);

  useEventEffect(eventService.listenForOpenConfigPanelEvent(), (event) => {
    setData(event.data as IConfigPanelData);
    setHasData(true);
  });

  useEventEffect(eventService.listenForCloseConfigPanelEvent(), () => {
    setData(EMPTY_DATA);
    setHasData(false);
  });

  function onPropertyChange(propertiesJSON: string) {
    data.propertyChangeCallback?.(propertiesJSON);
  }

  function close() {
    eventService.emitCloseConfigPanelEvent();
    eventService.emitBoardGadgetPropertyChangeEvent();
  }

  return (
    <div className="config-panel">
      <div className="config-panel-header">
        <span className="config-panel-title">Configure: {data.title}</span>
        <IconButton className="config-panel-close" onClick={close} size="small" aria-label="Close configuration panel">
          <MatIcon>close</MatIcon>
        </IconButton>
      </div>

      {hasData && (
        <div className="config-panel-body">
          <DynamicForm
            gadgetTags={data.tags}
            propertyPages={data.propertyPages}
            instanceId={data.instanceId}
            onUpdateProperties={onPropertyChange}
          />
        </div>
      )}
    </div>
  );
}
