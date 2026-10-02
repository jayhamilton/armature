import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { TabApplication } from './tab-application/TabApplication';
import { TabBoards } from './tab-boards/TabBoards';
import { TabEndpoints } from './tab-endpoints/TabEndpoints';
import './Configuration.css';

const TABS = ['Application', 'Boards', 'Endpoints'];

/** Ported from armature-ui's ConfigurationComponent (the "Board settings" dialog). */
export function Configuration({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth={false} slotProps={{ paper: { sx: { width: 1100, maxWidth: '95vw' } } }}>
      <DialogTitle className="configuration-title">Configuration</DialogTitle>
      <DialogContent className="configuration-content">
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          {TABS.map((label, index) => (
            <Tab key={label} label={label} id={`configuration-tab-${index}`} aria-controls="configuration-tabpanel" />
          ))}
        </Tabs>

        <div
          className="configuration-tab-body"
          role="tabpanel"
          id="configuration-tabpanel"
          aria-labelledby={`configuration-tab-${tabIndex}`}
        >
          {tabIndex === 0 && <TabApplication />}
          {tabIndex === 1 && <TabBoards onBoardAdd={onClose} />}
          {tabIndex === 2 && <TabEndpoints />}
        </div>
      </DialogContent>
      <DialogActions className="configuration-actions">
        <Button color="primary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
