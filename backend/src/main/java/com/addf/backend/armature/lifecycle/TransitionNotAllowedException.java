package com.addf.backend.armature.lifecycle;

import com.addf.backend.armature.problem.ProblemException;
import com.addf.backend.armature.problem.ProblemType;

/**
 * Thrown when a lifecycle state refuses an event: the {@code transition-not-allowed} problem. It
 * carries the state and event names so the detail says exactly what was refused.
 */
public class TransitionNotAllowedException extends ProblemException {

    private final String state;
    private final String event;

    public TransitionNotAllowedException(String state, String event) {
        super(ProblemType.TRANSITION_NOT_ALLOWED, "Event " + event + " is not allowed in state " + state);
        this.state = state;
        this.event = event;
    }

    public String state() {
        return state;
    }

    public String event() {
        return event;
    }
}
