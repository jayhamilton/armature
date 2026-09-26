package com.addf.backend.armature.board;

import java.util.function.UnaryOperator;

/**
 * The events a board's lifecycle understands. Each event carries the {@link BoardState} operation
 * it triggers, so firing an event needs no {@code switch}: the event calls the operation, and the
 * current state decides whether to allow it.
 */
public enum BoardEvent {
    PUBLISH(BoardState::publish),
    DISCARD(BoardState::discard),
    LOCK(BoardState::lock),
    UNLOCK(BoardState::unlock),
    ARCHIVE(BoardState::archive);

    private final UnaryOperator<BoardState> operation;

    BoardEvent(UnaryOperator<BoardState> operation) {
        this.operation = operation;
    }

    /** Asks {@code state} to handle this event; the state throws if it refuses. */
    BoardState applyTo(BoardState state) {
        return operation.apply(state);
    }
}
