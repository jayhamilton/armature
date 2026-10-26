package com.addf.backend.armature.tmf;

import java.util.List;

import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.ProblemException;
import com.addf.backend.armature.problem.ProblemType;

/**
 * A TMF 630 query parameter cannot be applied: the {@code invalid-query} problem. The error's
 * pointer names the parameter, for example {@code /query/limit}.
 */
public class InvalidQueryException extends ProblemException {

    public InvalidQueryException(String parameter, String detail) {
        super(ProblemType.INVALID_QUERY, "Query parameter '" + parameter + "': " + detail,
                List.of(new FieldProblem("/query/" + parameter, detail)));
    }
}
