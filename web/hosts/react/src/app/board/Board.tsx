import { useEffect, useMemo, useState } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { throttleTime } from 'rxjs/operators';
import { eventService, type IEvent } from '../eventservice/event.service';
import { boardService } from './board.service';
import { layoutService } from '../layout/layout.service';
import { themeService } from '../theme/theme.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { useObservableValue } from 'src/lib/useObservable';
import { BoardColumn } from './BoardColumn';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import { BoardType, type IBoard } from './board.model';
import type { IGadget } from '../gadgets/common/gadget-common/gadget-base/gadget.model';
import './Board.css';

function findGadgetLocation(board: IBoard, instanceId: number) {
  for (let rowIndex = 0; rowIndex < board.rows.length; rowIndex++) {
    const columns = board.rows[rowIndex].columns;
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex++) {
      const gadgetIndex = columns[columnIndex].gadgets.findIndex((g) => g.instanceId === instanceId);
      if (gadgetIndex !== -1) return { rowIndex, columnIndex, gadgetIndex };
    }
  }
  return undefined;
}

function columnDropId(rowIndex: number, columnIndex: number) {
  return `col-r${rowIndex}-c${columnIndex}`;
}

/** Ported from armature-ui's BoardComponent. */
export function Board() {
  const [boardData, setBoardData] = useState<IBoard | null>(null);
  const locked = useObservableValue(boardService.locked$, () => boardService.isLocked());
  const isDark = useObservableValue(themeService.isDark$, () => themeService.isDark);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function displayLastSelectedBoard() {
    boardService.getLastSelectedBoard().subscribe((board) => setBoardData(board));
  }

  function displayNavSelectedBoard(boardId: number) {
    boardService.getBoardById(boardId).subscribe((board) => setBoardData(board));
  }

  useEffect(() => {
    displayLastSelectedBoard();
  }, []);

  useEventEffect(eventService.listenForBoardCreatedCompleteEvent(), () => displayLastSelectedBoard());
  useEventEffect(eventService.listenForBoardDeletedCompleteEvent(), () => displayLastSelectedBoard());
  useEventEffect(eventService.listenForBoardSelectedEvent(), (event: IEvent) =>
    displayNavSelectedBoard(event.data)
  );
  useEventEffect(eventService.listenForGadgetPropertyChangeEvents(), () => displayLastSelectedBoard());
  useEventEffect(eventService.listenForGadgetDeleteEvent(), () => displayLastSelectedBoard());

  useEventEffect(eventService.listenForLayoutChangeEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      layoutService.changeLayout(event, next);
      return next;
    });
  });

  useEventEffect(eventService.listenForBoardWidthChangeEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      layoutService.updateBoardWidth(next, event.data.contentWidth);
      return next;
    });
  });

  useEventEffect(eventService.listenForBoardAddRowEvent(), () => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      layoutService.addRow(next);
      return next;
    });
  });

  useEventEffect(eventService.listenForBoardRemoveRowEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      layoutService.removeRow(next, event.data.rowIndex);
      return next;
    });
  });

  useEventEffect(eventService.listenForBoardMoveRowEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      layoutService.moveRow(next, event.data.previousIndex, event.data.currentIndex);
      return next;
    });
  });

  useEventEffect(eventService.listenForLibraryAddGadgetEvents().pipe(throttleTime(1000)), (event: IEvent) => {
    if (!boardData) return;
    boardService.saveNewGadgetToBoard(boardData, event.data as IGadget);
    displayLastSelectedBoard();
  });

  useEventEffect(eventService.listenForBoardUpdateNameDescriptionRequestEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current || current.id !== event.data['id']) return current;
      return { ...current, description: event.data['description'], title: event.data['title'], icon: event.data['icon'] };
    });
  });

  useEventEffect(eventService.listenForGadgetMoveRequestEvent(), (event: IEvent) => {
    setBoardData((current) => {
      if (!current) return current;
      const next = structuredClone(current);
      moveGadget(next, event.data.instanceId, event.data.direction);
      boardService.updateBoardDueToDragAndDrop(next);
      return next;
    });
  });

  function moveGadget(board: IBoard, instanceId: number, direction: 'left' | 'right' | 'up' | 'down') {
    const location = findGadgetLocation(board, instanceId);
    if (!location) return;

    const { rowIndex, columnIndex, gadgetIndex } = location;
    const sourceColumn = board.rows[rowIndex].columns[columnIndex];

    let targetRowIndex = rowIndex;
    let targetColumnIndex = columnIndex;

    if (direction === 'left' || direction === 'right') {
      targetColumnIndex += direction === 'left' ? -1 : 1;
      const columnsInRow = board.rows[rowIndex].columns.length;
      if (targetColumnIndex < 0 || targetColumnIndex >= columnsInRow) return;
    } else {
      targetRowIndex += direction === 'up' ? -1 : 1;
      if (targetRowIndex < 0 || targetRowIndex >= board.rows.length) return;
      targetColumnIndex = Math.min(columnIndex, board.rows[targetRowIndex].columns.length - 1);
      if (targetColumnIndex < 0) return;
    }

    const targetColumn = board.rows[targetRowIndex].columns[targetColumnIndex];
    const [gadget] = sourceColumn.gadgets.splice(gadgetIndex, 1);
    targetColumn.gadgets.push(gadget);
  }

  function handleDragEnd(dragEvent: DragEndEvent) {
    const { active, over } = dragEvent;
    if (!over || !boardData) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const instanceId = Number(activeId.replace('gadget-', ''));
    const source = findGadgetLocation(boardData, instanceId);
    if (!source) return;

    let targetRowIndex: number;
    let targetColumnIndex: number;
    let targetIndex: number;

    const colMatch = overId.match(/^col-r(\d+)-c(\d+)$/);
    if (colMatch) {
      targetRowIndex = Number(colMatch[1]);
      targetColumnIndex = Number(colMatch[2]);
      targetIndex = boardData.rows[targetRowIndex].columns[targetColumnIndex].gadgets.length;
    } else {
      const overInstanceId = Number(overId.replace('gadget-', ''));
      const overLocation = findGadgetLocation(boardData, overInstanceId);
      if (!overLocation) return;
      targetRowIndex = overLocation.rowIndex;
      targetColumnIndex = overLocation.columnIndex;
      targetIndex = overLocation.gadgetIndex;
    }

    const next = structuredClone(boardData);
    const sourceColumn = next.rows[source.rowIndex].columns[source.columnIndex];
    const [moved] = sourceColumn.gadgets.splice(source.gadgetIndex, 1);

    let insertAt = targetIndex;
    if (
      source.rowIndex === targetRowIndex &&
      source.columnIndex === targetColumnIndex &&
      source.gadgetIndex < targetIndex
    ) {
      insertAt -= 1;
    }

    const destColumn = next.rows[targetRowIndex].columns[targetColumnIndex];
    destColumn.gadgets.splice(insertAt, 0, moved);

    setBoardData(next);
    boardService.updateBoardDueToDragAndDrop(next);
  }

  const boardExists = boardData != null && boardData.id !== BoardType.EMPTYBOARDCOLLECTION;

  const selectedTabIndex = useMemo(() => {
    if (!boardData) return 0;
    const index = boardData.tabs?.findIndex((tab) => tab.id === boardData.id) ?? -1;
    return index >= 0 ? index : 0;
  }, [boardData]);

  function boardWidthClass() {
    return 'board-width-' + (boardData?.contentWidth || 'normal');
  }

  if (!boardExists) {
    return (
      <div className="empty-state">
        <MatIcon className="empty-state-icon">space_dashboard</MatIcon>
        <h2>Let's build your first dashboard</h2>
        <p>Here's a quick walkthrough of the two steps to get started.</p>

        <div className="tour">
          <div className="tour-frame">
            <div className="tour-stage">
              <div className="tour-toolbar-window">
                <img src={isDark ? '/assets/images/onboarding/toolbar-nav-dark.png' : '/assets/images/onboarding/toolbar-nav.png'} alt="" />
                <div className="tour-ring tour-ring-settings" />
              </div>
            </div>
            <div className="tour-stage">
              <img
                className="panel-image"
                src={isDark ? '/assets/images/onboarding/configuration-panel-dark.png' : '/assets/images/onboarding/configuration-panel.png'}
                alt="The board configuration panel, where a new board is defined"
              />
            </div>
            <div className="tour-stage">
              <div className="tour-toolbar-window">
                <img src={isDark ? '/assets/images/onboarding/toolbar-nav-dark.png' : '/assets/images/onboarding/toolbar-nav.png'} alt="" />
                <div className="tour-ring tour-ring-library" />
              </div>
            </div>
            <div className="tour-stage">
              <img
                className="panel-image"
                src={isDark ? '/assets/images/onboarding/library-panel-dark.png' : '/assets/images/onboarding/library-panel.png'}
                alt="The gadget library panel, listing gadgets that can be added to a board"
              />
            </div>
          </div>

          <div className="tour-dots" aria-hidden="true">
            <span className="tour-dot" />
            <span className="tour-dot" />
            <span className="tour-dot" />
            <span className="tour-dot" />
          </div>

          <div className="tour-caption">
            <p className="tour-caption-text">
              <strong>Step 1</strong> — use the settings menu to create your first board instance.
            </p>
            <p className="tour-caption-text">
              <strong>Step 2</strong> — open the gadget library and populate the board with one or more gadgets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {boardData!.tabs.length > 1 && (
        <Tabs
          value={selectedTabIndex}
          onChange={(_event, value) => displayNavSelectedBoard(boardData!.tabs[value].id)}
          className="board-tabs"
        >
          {boardData!.tabs.map((tab) => (
            <Tab key={tab.id} label={tab.title} />
          ))}
        </Tabs>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className={boardWidthClass()}>
          {boardData!.rows.map((row, rowIndex) => (
            <div key={rowIndex} className={['board-row', layoutService.structureForRow(boardData!, rowIndex)].join(' ')}>
              {row.columns.map((column, columnIndex) => (
                <BoardColumn
                  key={columnDropId(rowIndex, columnIndex)}
                  id={columnDropId(rowIndex, columnIndex)}
                  gadgets={column.gadgets}
                  disabled={locked}
                />
              ))}
            </div>
          ))}
        </div>
      </DndContext>
    </>
  );
}
