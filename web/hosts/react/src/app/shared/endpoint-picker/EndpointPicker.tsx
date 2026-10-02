import { useEffect, useState } from 'react';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import { MatIcon } from '../mat-icon/MatIcon';
import { endpointService } from '../../configuration/tab-endpoints/endpoint.service';
import type { IEndpoint } from '../../configuration/tab-endpoints/endpoint.model';
import type { ITag } from '../../gadgets/common/gadget-common/gadget-base/gadget.model';
import './EndpointPicker.css';

/**
 * Stored as a gadget instance's dataSource property value. Not an endpoint
 * id: the always present fallback that keeps hand edited JSON working.
 */
export const MANUAL_DATA_SOURCE = 'manual';

/**
 * Ported from armature-ui's EndpointPickerComponent: which endpoint (if any)
 * this gadget instance pulls data from, limited to endpoints whose tags
 * intersect the gadget's own tags, plus the permanent Manual option.
 */
export function EndpointPicker({
  value,
  onChange,
  gadgetTags,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  gadgetTags: ITag[];
}) {
  const current = value || MANUAL_DATA_SOURCE;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [allEndpoints, setAllEndpoints] = useState<IEndpoint[]>([]);

  useEffect(() => {
    const subscription = endpointService.getEndpoints().subscribe({
      next: setAllEndpoints,
      // No backend, or the route errors: degrade to "only Manual available"
      // rather than breaking the gadget's whole config form.
      error: () => setAllEndpoints([]),
    });
    return () => subscription.unsubscribe();
  }, []);

  const gadgetTagNames = new Set(gadgetTags.map((t) => t.name.toLowerCase()));
  const eligibleEndpoints =
    gadgetTagNames.size === 0
      ? []
      : allEndpoints.filter((endpoint) => endpoint.tags.some((t) => gadgetTagNames.has(t.name.toLowerCase())));

  const selectedLabel =
    current === MANUAL_DATA_SOURCE ? 'Manual' : (allEndpoints.find((e) => e.id === current)?.name ?? 'Manual');

  function select(next: string) {
    onChange(next);
    setAnchor(null);
  }

  return (
    <div className="endpoint-picker">
      <Tooltip title="Choose a data source">
        <button
          type="button"
          className="endpoint-picker-trigger"
          aria-label={`Data source: ${selectedLabel}`}
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          <MatIcon className="endpoint-picker-trigger-icon">{current === MANUAL_DATA_SOURCE ? 'edit_note' : 'cloud'}</MatIcon>
          <span className="endpoint-picker-trigger-label">{selectedLabel}</span>
        </button>
      </Tooltip>

      <Menu open={anchor != null} anchorEl={anchor} onClose={() => setAnchor(null)}>
        <MenuItem selected={current === MANUAL_DATA_SOURCE} onClick={() => select(MANUAL_DATA_SOURCE)}>
          <ListItemIcon>
            <MatIcon>edit_note</MatIcon>
          </ListItemIcon>
          Manual
        </MenuItem>
        {eligibleEndpoints.map((endpoint) => (
          <MenuItem key={endpoint.id} selected={current === endpoint.id} onClick={() => select(endpoint.id)}>
            <ListItemIcon>
              <MatIcon>cloud</MatIcon>
            </ListItemIcon>
            {endpoint.name}
          </MenuItem>
        ))}
        {eligibleEndpoints.length === 0 && (
          <div className="endpoint-picker-empty">No endpoints match this gadget's tags yet.</div>
        )}
      </Menu>
    </div>
  );
}
