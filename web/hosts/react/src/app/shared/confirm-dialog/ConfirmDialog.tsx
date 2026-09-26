import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { MatIcon } from '../mat-icon/MatIcon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

/**
 * Ported from armature-ui's ConfirmDialogComponent (a MatDialog opened
 * imperatively via `dialog.open(ConfirmDialogComponent, { data })`). React
 * has no dialog service, so this is a plain controlled component instead —
 * the caller owns `open` state and passes onConfirm/onCancel, same shape
 * `ref.afterClosed().subscribe(confirmed => ...)` produced.
 */
export function ConfirmDialog({
  open,
  data,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  data: ConfirmDialogData;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '1.1rem',
          fontWeight: 500,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <MatIcon style={{ color: '#f44336' }}>warning</MatIcon>
        {data.title}
      </DialogTitle>
      <DialogContent sx={{ padding: '20px 24px 16px !important' }}>
        <p style={{ margin: 0, color: '#555', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {data.message}
        </p>
      </DialogContent>
      <DialogActions sx={{ gap: '10px', padding: '12px 24px 16px', borderTop: '1px solid #e0e0e0' }}>
        <Button variant="outlined" onClick={onCancel}>
          {data.cancelLabel || 'Cancel'}
        </Button>
        <Button variant="contained" color="error" onClick={onConfirm}>
          {data.confirmLabel || 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
