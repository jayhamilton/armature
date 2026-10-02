import { useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { MatIcon } from '../mat-icon/MatIcon';
import { ICON_OPTIONS } from './icon-options';
import './IconPicker.css';

/**
 * Ported from armature-ui's IconPickerComponent: a trigger showing the
 * current icon, opening a searchable grid of curated Material Icons
 * ligature names. Angular's ControlValueAccessor becomes a controlled
 * component (`value`, `onChange`), the React equivalent of binding it with
 * [formControl].
 */
export function IconPicker({ value, onChange }: { value: string | undefined; onChange: (icon: string) => void }) {
  const current = value || 'dashboard';
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [filterText, setFilterText] = useState('');

  const term = filterText.trim().toLowerCase();
  const filteredIcons = term ? ICON_OPTIONS.filter((icon) => icon.includes(term)) : ICON_OPTIONS;

  function close() {
    setAnchor(null);
    setFilterText('');
  }

  function select(icon: string) {
    onChange(icon);
    close();
  }

  return (
    <div className="icon-picker">
      <Tooltip title="Choose an icon">
        <Button className="icon-picker-trigger" aria-label="Choose an icon" onClick={(e) => setAnchor(e.currentTarget)}>
          <MatIcon>{current}</MatIcon>
          <span className="icon-picker-trigger-label">{current}</span>
        </Button>
      </Tooltip>

      <Popover
        open={anchor != null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <div className="icon-picker-panel">
          <TextField
            fullWidth
            size="small"
            label="Search icons"
            placeholder="e.g. factory, chart, home"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MatIcon>search</MatIcon>
                  </InputAdornment>
                ),
              },
            }}
          />

          <div className="icon-picker-grid">
            {filteredIcons.map((icon) => (
              <Tooltip key={icon} title={icon}>
                <IconButton
                  className={'icon-picker-option' + (icon === current ? ' selected' : '')}
                  aria-label={icon}
                  aria-pressed={icon === current}
                  onClick={() => select(icon)}
                >
                  <MatIcon>{icon}</MatIcon>
                </IconButton>
              </Tooltip>
            ))}
            {filteredIcons.length === 0 && <div className="icon-picker-empty">No icons match "{filterText}"</div>}
          </div>
        </div>
      </Popover>
    </div>
  );
}
