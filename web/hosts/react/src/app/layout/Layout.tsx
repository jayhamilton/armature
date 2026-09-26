import { useEffect, useState } from 'react';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import { boardService } from '../board/board.service';
import { eventService } from '../eventservice/event.service';
import { layoutService, LayoutService } from './layout.service';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { boardWidths, BoardWidth, layouts, type LayoutType } from './layout.model';
import type { IBoard } from '../board/board.model';
import './Layout.css';

interface IRowSummary {
  index: number;
  structure: string;
  columnCount: number;
  gadgetCount: number;
}

function summarizeRows(board: IBoard): IRowSummary[] {
  const boardRows = board.rows || [];
  return boardRows.map((row, index) => {
    const structure = layoutService.structureForRow(board, index);
    return {
      index,
      structure,
      columnCount: row.columns?.length ?? LayoutService.columnCountFor(structure),
      gadgetCount: (row.columns || []).reduce(
        (total, column) => total + (column.gadgets?.length ?? 0),
        0
      ),
    };
  });
}

function RowItem({
  row,
  selected,
  canRemove,
  onSelect,
  onRemove,
}: {
  row: IRowSummary;
  selected: boolean;
  canRemove: boolean;
  onSelect: () => void;
  onRemove: (event: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: row.index,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={['row-item', selected ? 'selected' : ''].filter(Boolean).join(' ')}
      onClick={onSelect}
    >
      <span {...attributes} {...listeners}>
        <Tooltip title="Drag to reorder">
          <MatIcon className="row-item-handle">drag_indicator</MatIcon>
        </Tooltip>
      </span>
      <MatIcon className="row-item-icon">table_rows</MatIcon>
      <span className="row-item-label">Row {row.index + 1}</span>
      <span className="row-item-meta">
        {row.columnCount} {row.columnCount === 1 ? 'column' : 'columns'} &middot; {row.gadgetCount}{' '}
        {row.gadgetCount === 1 ? 'gadget' : 'gadgets'}
      </span>
      {canRemove && (
        <Tooltip
          title={row.gadgetCount > 0 ? 'Remove row (its gadgets move to Row 1)' : 'Remove row'}
        >
          <IconButton className="row-item-remove" size="small" onClick={onRemove} aria-label="Remove row">
            <MatIcon>delete</MatIcon>
          </IconButton>
        </Tooltip>
      )}
    </li>
  );
}

/** Ported from armature-ui's SidelayoutComponent. */
export function Layout() {
  const [rows, setRows] = useState<IRowSummary[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [selectedLayoutId, setSelectedLayoutId] = useState(-1);
  const [selectedWidth, setSelectedWidth] = useState<BoardWidth>(BoardWidth.NORMAL);
  const [tabIndex, setTabIndex] = useState(0);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function syncSelectedLayoutToRow(row: IRowSummary | undefined) {
    if (!row) {
      setSelectedLayoutId(-1);
      return;
    }
    const match = layouts.find((layout) => layout.structure.localeCompare(row.structure) === 0);
    setSelectedLayoutId(match?.id ?? -1);
  }

  function applyBoard(board: IBoard | undefined, resetSelection: boolean) {
    if (!board) return;
    setSelectedWidth((board.contentWidth as BoardWidth) || BoardWidth.NORMAL);
    const nextRows = summarizeRows(board);
    setRows(nextRows);

    setSelectedRowIndex((current) => {
      const nextIndex = resetSelection ? 0 : current >= nextRows.length ? Math.max(0, nextRows.length - 1) : current;
      syncSelectedLayoutToRow(nextRows[nextIndex]);
      return nextIndex;
    });
  }

  useEffect(() => {
    // Seed from whichever board is already active — the initial default
    // board on app load never fires a BoardSelectedEvent, so without this
    // the panel would show nothing selected until the user switched boards.
    const sub1 = boardService.getLastSelectedBoard().subscribe((board) => applyBoard(board, true));

    const sub2 = eventService.listenForBoardSelectedEvent().subscribe((event) => {
      boardService.getBoardById(event.data).subscribe((board) => applyBoard(board, true));
    });

    const sub3 = eventService.listenForBoardCreatedCompleteEvent().subscribe(() => {
      boardService.getLastSelectedBoard().subscribe((board) => applyBoard(board, true));
    });

    const sub4 = eventService.listenForBoardRowsChangedEvent().subscribe(() => {
      boardService.getLastSelectedBoard().subscribe((board) => applyBoard(board, false));
    });

    return () => {
      sub1.unsubscribe();
      sub2.unsubscribe();
      sub3.unsubscribe();
      sub4.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedRow = rows[selectedRowIndex];
  const canRemoveRow = rows.length > 1;

  function selectRow(index: number) {
    setSelectedRowIndex(index);
    syncSelectedLayoutToRow(rows[index]);
  }

  function addRow() {
    setSelectedRowIndex(rows.length);
    eventService.emitBoardAddRowEvent();
  }

  function indexAfterMove(index: number, from: number, to: number): number {
    if (index === from) return to;
    if (from < index && to >= index) return index - 1;
    if (from > index && to <= index) return index + 1;
    return index;
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const previousIndex = Number(active.id);
    const currentIndex = Number(over.id);

    setRows((current) => arrayMove(current, previousIndex, currentIndex).map((row, index) => ({ ...row, index })));
    setSelectedRowIndex((current) => indexAfterMove(current, previousIndex, currentIndex));

    eventService.emitBoardMoveRowEvent({ data: { previousIndex, currentIndex } });
  }

  function removeRow(index: number, mouseEvent: React.MouseEvent) {
    mouseEvent.stopPropagation();
    if (!canRemoveRow) return;
    eventService.emitBoardRemoveRowEvent({ data: { rowIndex: index } });
  }

  function selectBoardLayout(structure: LayoutType, layoutId: number) {
    setSelectedLayoutId(layoutId);
    eventService.emitLayoutChange({ data: { structure, rowIndex: selectedRowIndex } });
  }

  function selectBoardWidth(contentWidth: BoardWidth) {
    setSelectedWidth(contentWidth);
    eventService.emitBoardWidthChangeEvent({ data: { contentWidth } });
  }

  function close() {
    eventService.emitBoardSideLayoutClickEvent();
  }

  return (
    <div className="layout-panel">
      <div className="layout-panel-header">
        <span className="layout-panel-title">Board Layouts</span>
        <IconButton className="layout-panel-close" onClick={close} aria-label="Close board layouts panel" size="small">
          <MatIcon>close</MatIcon>
        </IconButton>
      </div>

      <div className="layout-panel-body">
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)} className="layout-tabs">
          <Tab label="Layout" />
          <Tab label="Width" />
        </Tabs>

        {tabIndex === 0 && (
          <>
            <div className="row-section">
              <h3 className="section-label">Rows</h3>

              <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <SortableContext items={rows.map((r) => r.index)} strategy={verticalListSortingStrategy}>
                  <ul className="row-list">
                    {rows.map((row) => (
                      <RowItem
                        key={row.index}
                        row={row}
                        selected={row.index === selectedRowIndex}
                        canRemove={canRemoveRow}
                        onSelect={() => selectRow(row.index)}
                        onRemove={(e) => removeRow(row.index, e)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>

              <Button variant="outlined" color="primary" className="add-row-button" onClick={addRow} startIcon={<MatIcon>add</MatIcon>}>
                Add Row
              </Button>
            </div>

            <div className="layout-section">
              <h3 className="section-label">
                Layout {selectedRow && <span className="section-label-target">for Row {selectedRowIndex + 1}</span>}
              </h3>

              <div className="grid-layout">
                <ul>
                  {layouts.map((layout) => (
                    <li key={layout.id} style={{ listStyle: 'none' }}>
                      <img
                        className={selectedLayoutId === layout.id ? 'layout-selected' : ''}
                        src={`/assets/images/layout/${layout.structure}.png`}
                        onClick={() => selectBoardLayout(layout.structure, layout.id)}
                        alt={layout.structure}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}

        {tabIndex === 1 && (
          <div className="width-section">
            <h3 className="section-label">Board Width</h3>

            <ul className="width-list">
              {boardWidths.map((width) => (
                <Tooltip key={width.value} title={width.description} placement="right">
                  <li
                    className={['width-item', width.value === selectedWidth ? 'selected' : ''].filter(Boolean).join(' ')}
                    onClick={() => selectBoardWidth(width.value)}
                  >
                    <MatIcon className="width-item-icon">{width.icon}</MatIcon>
                    <span className="width-item-label">{width.label}</span>
                  </li>
                </Tooltip>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
