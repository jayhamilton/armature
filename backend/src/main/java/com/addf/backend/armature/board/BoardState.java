package com.addf.backend.armature.board;

import java.util.Set;

import com.addf.backend.armature.lifecycle.TransitionNotAllowedException;
import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;

/**
 * A board's lifecycle state: {@code DRAFT}, {@code PUBLISHED}, {@code LOCKED}, or {@code ARCHIVED}.
 *
 * <h2>Pattern</h2>
 * State. This interface is the State role; each record that implements it is a ConcreteState.
 * Every operation is refused by default, and a state overrides only the transitions it allows.
 *
 * <h2>Principle</h2>
 * Open/Closed: behavior per state lives in that state's class, so adding a state adds a class and
 * leaves the others unchanged. The hierarchy is sealed, so the compiler knows every state.
 *
 * <h2>Why here</h2>
 * Board rules were implied by boolean flags such as {@code locked}. Explicit states make the rules
 * visible, testable, and (from INC-02) the source of the links a client sees.
 *
 * <h2>How to extend</h2>
 * Add a record implementing this interface, add it to {@code permits}, override the operations it
 * allows, and list them in {@link #allowedEvents()}. {@code BoardLifecycleTest} checks that the
 * two agree. The exercise in {@code docs/patterns/state.md} adds a {@code RESTORED} state.
 *
 * <h2>See also</h2>
 * {@link BoardLifecycle}, {@link BoardEvent}, {@code docs/patterns/state.md}.
 */
@DesignPattern(pattern = Pattern.STATE, role = "State", doc = "docs/patterns/state.md")
@SolidPrinciple(value = Principle.OPEN_CLOSED,
        note = "A new board state is a new class; no existing state changes.")
public sealed interface BoardState permits Draft, Published, Locked, Archived {

    /** The state's name as it appears in resources and events, for example {@code DRAFT}. */
    String name();

    /** The events this state accepts. Must match the operations the state overrides. */
    Set<BoardEvent> allowedEvents();

    default BoardState publish() {
        throw refuse(BoardEvent.PUBLISH);
    }

    default BoardState discard() {
        throw refuse(BoardEvent.DISCARD);
    }

    default BoardState lock() {
        throw refuse(BoardEvent.LOCK);
    }

    default BoardState unlock() {
        throw refuse(BoardEvent.UNLOCK);
    }

    default BoardState archive() {
        throw refuse(BoardEvent.ARCHIVE);
    }

    private TransitionNotAllowedException refuse(BoardEvent event) {
        return new TransitionNotAllowedException(name(), event.name());
    }
}
