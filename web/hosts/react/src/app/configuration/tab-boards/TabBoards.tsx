import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { boardService } from '../../board/board.service';
import { eventService } from '../../eventservice/event.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { ConfirmDialog } from '../../shared/confirm-dialog/ConfirmDialog';
import { MatIcon } from '../../shared/mat-icon/MatIcon';
import { Hiearchy, type IBoard, type IBoardCollection } from '../../board/board.model';
import '../Configuration.css';

/** Ported from armature-ui's TabBoardsComponent. */
export function TabBoards({ onBoardAdd }: { onBoardAdd: () => void }) {
  const [rows, setRows] = useState<IBoard[]>([]);
  const [dropdownOptions, setDropdownOptions] = useState<IBoard[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tabvalue, setTabvalue] = useState('');
  const [icon, setIcon] = useState('dashboard');
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<number | undefined>(undefined);
  const [dirty, setDirty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<IBoard | null>(null);

  function loadData() {
    boardService.getBoardCollection().subscribe((boardCollection: IBoardCollection) => {
      if (boardCollection.boardList.length === 0) {
        setRows([]);
        setDropdownOptions([]);
        return;
      }

      // Pair up parent and child entries so they appear together.
      const list: IBoard[] = [];
      boardCollection.boardList.forEach((board) => {
        if (board.relationship === Hiearchy.PARENT) {
          list.push(board);
          board.tabs.forEach((tab) => {
            boardCollection.boardList.forEach((candidate) => {
              if (tab.id === candidate.id && candidate.relationship === Hiearchy.CHILD) {
                list.push(candidate);
              }
            });
          });
        }
      });
      setRows(list);

      setDropdownOptions(
        list.filter((board) => board.relationship === Hiearchy.PARENT && board.tabs.length === 1 && board.tabs[0].id === board.id)
      );
    });
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setTabvalue('');
    setIcon('dashboard');
    setDirty(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEventEffect(eventService.listenForBoardCreatedCompleteEvent(), () => {
    resetForm();
    loadData();
  });
  useEventEffect(eventService.listenForBoardDeletedCompleteEvent(), () => loadData());

  function create() {
    if (editMode) {
      update();
      return;
    }

    eventService.emitBoardCreateRequestEvent({
      data: { title, description, product: '', tabvalue, icon: icon || 'dashboard' },
    });
    onBoardAdd();
  }

  function edit(item: IBoard) {
    setTitle(item.title);
    setDescription(item.description);
    setIcon(item.icon || 'dashboard');
    setEditMode(true);
    setSelectedId(item.id);
    setDirty(true);
  }

  function update() {
    eventService.emitBoardUpdateNameDescription({
      data: { id: selectedId, title, description, icon: icon || 'dashboard' },
    });
    setEditMode(false);
    loadData();
    onBoardAdd();
  }

  function resetEditMode() {
    setEditMode(false);
    resetForm();
  }

  function requestDelete(item: IBoard) {
    setDeleteTarget(item);
  }

  function confirmDelete() {
    if (deleteTarget) eventService.emitBoardDeleteRequestEvent({ data: deleteTarget });
    setDeleteTarget(null);
  }

  const formValid = title.trim() !== '';

  return (
    <div>
      <div className="boards-form-section">
        <h3 className="section-label">Define a new board</h3>
        <div className="boards-form">
          <TextField
            size="small"
            label="Icon"
            value={icon}
            onChange={(e) => {
              setIcon(e.target.value);
              setDirty(true);
            }}
            className="form-field-icon"
            helperText="Material icon ligature name"
          />

          <TextField
            size="small"
            required
            label="Title"
            placeholder="Enter a title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            className="form-field-title"
          />

          <TextField
            size="small"
            label="Description"
            placeholder="Enter description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDirty(true);
            }}
            className="form-field-desc"
          />

          <TextField
            select
            size="small"
            label="Show board as tab"
            value={tabvalue}
            onChange={(e) => {
              setTabvalue(e.target.value);
              setDirty(true);
            }}
            className="form-field-tab"
          >
            <MenuItem value="">-- None --</MenuItem>
            {dropdownOptions.map((option) => (
              <MenuItem key={option.id} value={String(option.id)}>
                {option.title}
              </MenuItem>
            ))}
          </TextField>

          <div className="form-actions">
            <Button variant="contained" color="primary" onClick={create} disabled={!formValid || !dirty}>
              <MatIcon>{editMode ? 'check' : 'add'}</MatIcon>
              {editMode ? 'Update' : 'Add'}
            </Button>
            {editMode && (
              <Button variant="outlined" color="primary" onClick={resetEditMode}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="boards-table-section">
        <h3 className="section-label">Boards</h3>
        <Table size="small" className="boards-table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Title</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <MatIcon className="board-row-icon">{row.icon || 'dashboard'}</MatIcon>
                </TableCell>
                <TableCell>
                  {row.relationship === Hiearchy.CHILD && <MatIcon className="child-icon">subdirectory_arrow_right</MatIcon>}
                  <span className="board-title-text">{row.title}</span>
                </TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <div className="action-buttons">
                    <Tooltip title="Edit">
                      <IconButton color="primary" size="small" onClick={() => edit(row)}>
                        <MatIcon>edit</MatIcon>
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" size="small" onClick={() => requestDelete(row)}>
                        <MatIcon>delete</MatIcon>
                      </IconButton>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        data={{
          title: 'Delete Board',
          message: `Delete board "${deleteTarget?.title}"? This cannot be undone.`,
          confirmLabel: 'Delete',
        }}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
