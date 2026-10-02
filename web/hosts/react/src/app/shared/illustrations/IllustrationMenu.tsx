import { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { MatIcon } from '../mat-icon/MatIcon';
import { ILLUSTRATION_OPTIONS, illustrationSrc, type IllustrationOption } from './illustration-options';
import './Illustrations.css';

/**
 * Ported from armature-ui's IllustrationMenuComponent. Presentational
 * search and grid, shared by IllustrationPicker (a form control) and the
 * markdown editor's "Insert illustration" toolbar button (not a form
 * control, just takes a pick and closes its own popover). Neither caller
 * cares about the grid's internals, only the picked IllustrationOption.
 */
export function IllustrationMenu({
  selected,
  onPick,
}: {
  selected?: string | null;
  onPick: (option: IllustrationOption) => void;
}) {
  const [filterText, setFilterText] = useState('');
  // SVGs are user supplied (see public/assets/images/illustrations/README.md)
  // and may not have been downloaded yet, so broken thumbnails fall back to
  // a placeholder rather than the browser's default broken image icon.
  const [brokenIds, setBrokenIds] = useState<ReadonlySet<string>>(new Set());

  const term = filterText.trim().toLowerCase();
  const filtered = term
    ? ILLUSTRATION_OPTIONS.filter((option) => option.label.toLowerCase().includes(term) || option.id.includes(term))
    : ILLUSTRATION_OPTIONS;

  return (
    <div className="illustration-menu-panel">
      <TextField
        fullWidth
        size="small"
        label="Search illustrations"
        placeholder="e.g. team, empty, analytics"
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

      <div className="illustration-menu-grid">
        {filtered.map((option) => (
          <Tooltip key={option.id} title={option.label}>
            <button
              type="button"
              className={'illustration-menu-option' + (option.id === selected ? ' selected' : '')}
              aria-pressed={option.id === selected}
              onClick={() => onPick(option)}
            >
              {brokenIds.has(option.id) ? (
                <MatIcon className="illustration-menu-missing-icon">image_not_supported</MatIcon>
              ) : (
                <img
                  src={illustrationSrc(option.id)}
                  alt=""
                  onError={() => setBrokenIds((ids) => new Set(ids).add(option.id))}
                />
              )}
              <span className="illustration-menu-option-label">{option.label}</span>
            </button>
          </Tooltip>
        ))}
        {filtered.length === 0 && <div className="illustration-menu-empty">No illustrations match "{filterText}"</div>}
      </div>
    </div>
  );
}
