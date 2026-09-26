import { useEffect, useRef, useState } from 'react';
import { boardService } from '../board/board.service';
import { eventService } from '../eventservice/event.service';
import { useEventEffect } from 'src/lib/useEventEffect';
import { MatIcon } from '../shared/mat-icon/MatIcon';
import type { IBoard } from '../board/board.model';
import './BoardBanner.css';

/** Ported from armature-ui's BoardBannerComponent. */
export function BoardBanner() {
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [boardIcon, setBoardIcon] = useState('');
  const currentBoardId = useRef<number | undefined>(undefined);

  function applyBoard(board: IBoard) {
    currentBoardId.current = board.id;
    setBoardTitle(board.title);
    setBoardDescription(board.description || '');
    setBoardIcon(board.icon || 'dashboard');
  }

  function clearBoard() {
    currentBoardId.current = undefined;
    setBoardTitle('');
    setBoardDescription('');
    setBoardIcon('');
  }

  useEffect(() => {
    boardService.getLastSelectedBoard().subscribe((board) => {
      if (board?.title) applyBoard(board);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEventEffect(eventService.listenForBoardSelectedEvent(), (event) => {
    boardService.getBoardById(event.data).subscribe((board) => {
      if (board?.title) applyBoard(board);
    });
  });

  useEventEffect(eventService.listenForBoardCreatedCompleteEvent(), () => {
    boardService.getLastSelectedBoard().subscribe((board) => {
      if (board?.title) applyBoard(board);
    });
  });

  useEventEffect(eventService.listenForBoardUpdateNameDescriptionRequestEvent(), (event) => {
    if (event.data['id'] === currentBoardId.current) {
      setBoardTitle(event.data['title']);
      setBoardDescription(event.data['description'] || '');
      setBoardIcon(event.data['icon'] || 'dashboard');
    }
  });

  useEventEffect(eventService.listenForBoardDeletedCompleteEvent(), () => {
    boardService.getLastSelectedBoard().subscribe((board) => {
      if (board?.title) {
        applyBoard(board);
      } else {
        clearBoard();
      }
    });
  });

  if (!boardTitle) return null;

  return (
    <div className="board-banner">
      <MatIcon className="banner-icon">{boardIcon || 'dashboard'}</MatIcon>
      <span className="banner-title">{boardTitle}</span>
      {boardDescription && (
        <>
          <span className="banner-separator" />
          <span className="banner-description">{boardDescription}</span>
        </>
      )}
    </div>
  );
}
