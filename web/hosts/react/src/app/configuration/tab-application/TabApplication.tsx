import { useRef, useState } from 'react';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { appConfigService } from '../../app-config/app-config.service';
import { MatIcon } from '../../shared/mat-icon/MatIcon';
import '../Configuration.css';

/** Ported from armature-ui's TabApplicationComponent. */
export function TabApplication() {
  const [appTitle, setAppTitle] = useState(appConfigService.appTitle);
  const [dirty, setDirty] = useState(false);
  const [cardTransparent, setCardTransparent] = useState(appConfigService.cardBackgroundTransparent);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashSaved() {
    setSaved(true);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }

  function save() {
    appConfigService.setAppTitle(appTitle);
    setAppTitle(appConfigService.appTitle);
    setDirty(false);
    flashSaved();
  }

  function resetToDefault() {
    appConfigService.resetAppTitle();
    setAppTitle(appConfigService.appTitle);
    setDirty(false);
    flashSaved();
  }

  function toggleCardBackgroundTransparent(checked: boolean) {
    setCardTransparent(checked);
    appConfigService.setCardBackgroundTransparent(checked);
  }

  return (
    <div className="application-form-section">
      <h3 className="section-label">Application</h3>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Application title</div>
          <div className="setting-description">Shown in the toolbar across the top of the app.</div>
        </div>
        <div className="setting-control">
          <TextField
            size="small"
            placeholder="Enter an application title"
            value={appTitle}
            onChange={(e) => {
              setAppTitle(e.target.value);
              setDirty(true);
            }}
            className="form-field-app-title"
          />
          <div className="form-actions">
            <Button variant="contained" color="primary" onClick={save} disabled={!dirty}>
              <MatIcon>check</MatIcon> Save
            </Button>
            <Button variant="outlined" color="primary" onClick={resetToDefault}>
              Reset to default
            </Button>
            {saved && (
              <span className="saved-indicator">
                <MatIcon>check_circle</MatIcon> Saved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="setting-row">
        <div className="setting-info">
          <div className="setting-title">Transparent card backgrounds</div>
          <div className="setting-description">
            Removes the card fill on the board, so gadgets sit directly on the page background.
          </div>
        </div>
        <div className="setting-control">
          <Switch checked={cardTransparent} onChange={(e) => toggleCardBackgroundTransparent(e.target.checked)} />
        </div>
      </div>
    </div>
  );
}
