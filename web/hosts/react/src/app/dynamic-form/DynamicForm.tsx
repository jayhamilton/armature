import { useEffect, useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { eventService } from '../eventservice/event.service';
import { DynamicFormProperty } from './DynamicFormProperty';
import type { IPropertyPage, ITag } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import './DynamicForm.css';

function buildInitialValues(propertyPages: IPropertyPage[]): Record<string, any> {
  const values: Record<string, any> = {};
  propertyPages.forEach((page) => {
    page.properties.forEach((property) => {
      if (property.controlType === 'section') return;
      let val = property.value !== undefined && property.value !== null ? property.value : '';
      if (property.controlType === 'ace-editor' && typeof val !== 'string') {
        val = JSON.stringify(val, null, 2);
      }
      values[property.key] = val;
    });
  });
  return values;
}

function isFormValid(propertyPages: IPropertyPage[], values: Record<string, any>): boolean {
  return propertyPages.every((page) =>
    page.properties.every((property) => {
      if (property.controlType === 'section' || !property.required) return true;
      const value = values[property.key];
      return value !== '' && value !== undefined && value !== null;
    })
  );
}

/** Ported from armature-ui's DynamicFormComponent + DynamicFormPropertyComponent. */
export function DynamicForm({
  propertyPages,
  instanceId,
  gadgetTags,
  onUpdateProperties,
}: {
  propertyPages: IPropertyPage[];
  instanceId: number;
  gadgetTags: ITag[];
  onUpdateProperties: (propertiesJSON: string) => void;
}) {
  const [values, setValues] = useState<Record<string, any>>(() => buildInitialValues(propertyPages));
  const [dirty, setDirty] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showMessageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The config panel reuses a single DynamicForm across gadgets — rebuild
  // whenever the selected gadget changes, so stale values from the
  // previous gadget don't carry over.
  useEffect(() => {
    setValues(buildInitialValues(propertyPages));
    setDirty(false);
    setShowMessage(false);
    setTabIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId]);

  function handleChange(key: string, value: any) {
    setDirty(true);
    setValues((current) => {
      const next = { ...current, [key]: value };

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onUpdateProperties(JSON.stringify(next));
      }, 100);

      return next;
    });
  }

  function handleTabChange(index: number) {
    setTabIndex(index);
    // Emit tab change event so ACE editors can refresh if needed.
    eventService.emitChartDataChanged({
      data: { source: 'tab-change', tabIndex: index, tabLabel: propertyPages[index]?.displayName },
    });
  }

  function saveForm() {
    const payload = JSON.stringify(values);
    onUpdateProperties(payload);
    setShowMessage(true);
    if (showMessageTimer.current) clearTimeout(showMessageTimer.current);
    showMessageTimer.current = setTimeout(() => setShowMessage(false), 2000);
  }

  const valid = isFormValid(propertyPages, values);

  return (
    <>
      <form>
        <Tabs value={tabIndex} onChange={(_e, v) => handleTabChange(v)}>
          {propertyPages.map((page, index) => (
            <Tab
              key={page.groupId}
              label={page.displayName}
              id={`property-tab-${index}`}
              aria-controls={`property-tabpanel-${index}`}
            />
          ))}
        </Tabs>

        {propertyPages[tabIndex] && (
          <div
            className="gridContainer"
            role="tabpanel"
            id={`property-tabpanel-${tabIndex}`}
            aria-labelledby={`property-tab-${tabIndex}`}
          >
            {propertyPages[tabIndex].properties.map((property) => (
              <div
                key={property.key}
                className={[
                  'form-row',
                  ['ace-editor', 'json-forms', 'markdown', 'textarea', 'upload', 'section'].includes(
                    property.controlType
                  )
                    ? 'full-width-row'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <DynamicFormProperty
                  property={property}
                  value={values[property.key]}
                  onChange={(value) => handleChange(property.key, value)}
                  gadgetTags={gadgetTags}
                />
              </div>
            ))}
          </div>
        )}

        <div className="form-actions">
          <Button variant="contained" color="primary" onClick={saveForm} disabled={!valid || !dirty}>
            Save
          </Button>
        </div>
      </form>

      {showMessage && (
        <div className="form-row-message">
          <div>Saved!</div>
        </div>
      )}
    </>
  );
}
