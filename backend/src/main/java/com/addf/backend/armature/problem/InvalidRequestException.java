package com.addf.backend.armature.problem;

import java.util.List;

/** A request body breaks a rule: the {@code invalid-request} problem, one {@link FieldProblem} per rule broken. */
public class InvalidRequestException extends ProblemException {

    public InvalidRequestException(List<FieldProblem> errors) {
        super(ProblemType.INVALID_REQUEST, describe(errors), errors);
    }

    private static String describe(List<FieldProblem> errors) {
        return errors.size() == 1
                ? errors.getFirst().pointer() + ": " + errors.getFirst().detail()
                : errors.size() + " fields are not valid; see errors.";
    }
}
