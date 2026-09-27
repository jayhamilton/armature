package com.addf.backend.armature.lifecycle;

import java.util.Set;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import org.jmolecules.architecture.hexagonal.Port;

/**
 * Decides which transitions a resource's lifecycle allows, and performs them.
 *
 * <h2>Pattern</h2>
 * State, seen from the outside: this port is the Context's interface. Callers hand in the current
 * state and an event; the state objects themselves decide what happens.
 *
 * <h2>Principle</h2>
 * Dependency inversion: services and, from INC-02, the HAL assemblers depend on this interface,
 * not on a particular lifecycle's classes.
 *
 * <h2>Why here</h2>
 * The lifecycle decides which links appear, which problems are raised, and which events are
 * published (ADR-0004, ADR-0006). Four lifecycles are scheduled (board, capability, pinned answer,
 * composition task), so the port has more than one implementation.
 *
 * <h2>How to extend</h2>
 * A new lifecycle is a sealed state hierarchy, an event type, and one implementation of this
 * interface. Existing lifecycles do not change.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/state.md}, {@code docs/adr/0006-state-pattern-lifecycles.md},
 * {@code com.addf.backend.armature.board.BoardLifecycle}.
 *
 * @param <S> the lifecycle's state type
 * @param <E> the lifecycle's event type
 */
@Port
@DesignPattern(pattern = Pattern.STATE, role = "Context", doc = "docs/patterns/state.md")
@SolidPrinciple(value = Principle.DEPENDENCY_INVERSION,
        note = "Callers depend on this port, not on a lifecycle's concrete states.")
public interface LifecycleEngine<S, E> {

    /** The state a new resource starts in. */
    S initialState();

    /** The events the given state accepts; everything else is refused. */
    Set<E> allowedEvents(S state);

    /**
     * Applies an event to a state.
     *
     * @return the state after the transition
     * @throws TransitionNotAllowedException if {@code state} does not accept {@code event}
     */
    S fire(S state, E event);
}
