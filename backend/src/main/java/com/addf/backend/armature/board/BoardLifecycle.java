package com.addf.backend.armature.board;

import java.util.Set;

import com.addf.backend.armature.lifecycle.LifecycleEngine;
import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import org.springframework.stereotype.Service;

/**
 * The board lifecycle: {@code DRAFT} to {@code PUBLISHED} to {@code LOCKED}, and {@code ARCHIVED}.
 *
 * <h2>Pattern</h2>
 * State: the Context. It holds no rules of its own; it hands each event to the current state.
 *
 * <h2>Principle</h2>
 * Open/Closed: adding a state or transition never edits this class.
 *
 * <h2>Why here</h2>
 * The reference implementation of {@link LifecycleEngine}, before any board resource exists
 * (INC-01) or exposes links (INC-02).
 *
 * <h2>How to extend</h2>
 * Change {@link BoardState} and its records; this class stays as it is.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/state.md}, {@code BoardLifecycleTest}.
 */
@Service
@DesignPattern(pattern = Pattern.STATE, role = "Context", doc = "docs/patterns/state.md")
@SolidPrinciple(value = Principle.OPEN_CLOSED, note = "Delegates every decision to the current state.")
public class BoardLifecycle implements LifecycleEngine<BoardState, BoardEvent> {

    @Override
    public BoardState initialState() {
        return new Draft();
    }

    @Override
    public Set<BoardEvent> allowedEvents(BoardState state) {
        return state.allowedEvents();
    }

    @Override
    public BoardState fire(BoardState state, BoardEvent event) {
        return event.applyTo(state);
    }
}
