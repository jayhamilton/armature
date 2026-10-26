package com.addf.backend.armature.problem;

import java.util.List;

/**
 * The base of every exception that reaches a client. It names its {@link ProblemType}, so the
 * mapping to RFC 9457 needs no table of exception classes: {@link ProblemAdvice} handles this one
 * class, and a new problem is a new subclass (or a new instance) with a new catalog entry.
 */
public class ProblemException extends RuntimeException {

    private final ProblemType type;
    private final List<FieldProblem> errors;

    public ProblemException(ProblemType type, String detail) {
        this(type, detail, List.of());
    }

    public ProblemException(ProblemType type, String detail, List<FieldProblem> errors) {
        super(detail);
        this.type = type;
        this.errors = List.copyOf(errors);
    }

    public ProblemType type() {
        return type;
    }

    /** The occurrence's explanation, for a person; becomes the problem's {@code detail}. */
    public String detail() {
        return getMessage();
    }

    public List<FieldProblem> errors() {
        return errors;
    }
}
