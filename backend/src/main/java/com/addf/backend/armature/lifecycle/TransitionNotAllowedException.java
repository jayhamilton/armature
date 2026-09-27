package com.addf.backend.armature.lifecycle;

/**
 * Thrown when a lifecycle state refuses an event. From INC-01 this maps to an RFC 9457 problem;
 * for now it carries the state and event names so the message says exactly what was refused.
 */
public class TransitionNotAllowedException extends RuntimeException {

    private final String state;
    private final String event;

    public TransitionNotAllowedException(String state, String event) {
        super("Event " + event + " is not allowed in state " + state);
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
