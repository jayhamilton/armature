import { useState } from 'react';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import { MatIcon } from '../mat-icon/MatIcon';
import { IllustrationMenu } from './IllustrationMenu';
import { ILLUSTRATION_OPTIONS, illustrationSrc } from './illustration-options';
import './Illustrations.css';

/**
 * Ported from armature-ui's IllustrationPickerComponent: a trigger showing
 * the chosen illustration, opening IllustrationMenu in a popover. A
 * controlled component (`value`, `onChange`) in place of Angular's
 * ControlValueAccessor.
 */
export function IllustrationPicker({ value, onChange }: { value: string | undefined; onChange: (id: string) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

  const selectedOption = ILLUSTRATION_OPTIONS.find((option) => option.id === value);
  const thumbnailSrc = value ? illustrationSrc(value) : null;

  return (
    <div className="illustration-picker">
      <Tooltip title="Choose an illustration">
        <button
          type="button"
          className="illustration-picker-trigger"
          aria-label="Choose an illustration"
          onClick={(e) => setAnchor(e.currentTarget)}
        >
          {thumbnailSrc && brokenSrc !== thumbnailSrc ? (
            <img
              className="illustration-picker-trigger-thumb"
              src={thumbnailSrc}
              alt=""
              onError={() => setBrokenSrc(thumbnailSrc)}
            />
          ) : (
            <MatIcon className="illustration-picker-trigger-icon">image</MatIcon>
          )}
          <span className="illustration-picker-trigger-label">{selectedOption?.label ?? 'Choose an illustration'}</span>
        </button>
      </Tooltip>

      <Popover
        open={anchor != null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <IllustrationMenu
          selected={value}
          onPick={(option) => {
            onChange(option.id);
            setAnchor(null);
          }}
        />
      </Popover>
    </div>
  );
}
