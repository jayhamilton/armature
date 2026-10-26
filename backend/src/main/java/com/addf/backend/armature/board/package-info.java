/**
 * Boards: the board, row, and gadget instance resources (TMF 630, INC-01a), the {@link
 * com.addf.backend.armature.board.Board} aggregate behind them, and the board lifecycle as the State
 * pattern reference (ADR-0006). Storage is behind {@link com.addf.backend.armature.board.BoardRepository};
 * the in memory adapter is in {@code internal}.
 */
@ApplicationModule(displayName = "Board", allowedDependencies = { "lifecycle", "patterns", "problem", "tmf" })
package com.addf.backend.armature.board;

import org.springframework.modulith.ApplicationModule;
