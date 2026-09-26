package com.addf.backend.armature.board;

import java.util.Set;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;

/**
 * A new board being composed: it can be published, or discarded (which archives it).
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
@SolidPrinciple(value = Principle.OPEN_CLOSED, note = "Draft allows only publish and discard.")
public record Draft() implements BoardState {

    @Override
    public String name() {
        return "DRAFT";
    }

    @Override
    public Set<BoardEvent> allowedEvents() {
        return Set.of(BoardEvent.PUBLISH, BoardEvent.DISCARD);
    }

    @Override
    public BoardState publish() {
        return new Published();
    }

    @Override
    public BoardState discard() {
        return new Archived();
    }
}
