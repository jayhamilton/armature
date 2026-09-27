package com.addf.backend.armature.board;

import java.util.Set;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;

/**
 * A board in use: it can be locked against edits, or archived. Sharing and subscribing are actions allowed here, not transitions; they become link rules in INC-02.
 *
 * <h2>Pattern</h2>
 * State: a ConcreteState of {@link BoardState}.
 *
 * <h2>Principle</h2>
 * Open/Closed: this class knows only its own transitions.
 *
 * <h2>Why here</h2>
 * See {@link BoardState}.
 *
 * <h2>How to extend</h2>
 * To allow another event here, override its operation and add it to {@link #allowedEvents()}.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/state.md}.
 */
@DesignPattern(pattern = Pattern.STATE, role = "ConcreteState", doc = "docs/patterns/state.md")
@SolidPrinciple(value = Principle.OPEN_CLOSED, note = "Published allows only lock and archive.")
public record Published() implements BoardState {

    @Override
    public String name() {
        return "PUBLISHED";
    }

    @Override
    public Set<BoardEvent> allowedEvents() {
        return Set.of(BoardEvent.LOCK, BoardEvent.ARCHIVE);
    }

    @Override
    public BoardState lock() {
        return new Locked();
    }

    @Override
    public BoardState archive() {
        return new Archived();
    }
}
