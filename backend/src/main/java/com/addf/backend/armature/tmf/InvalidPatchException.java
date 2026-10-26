package com.addf.backend.armature.tmf;

import java.util.List;

import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.ProblemException;
import com.addf.backend.armature.problem.ProblemType;

/**
 * A patch is malformed, a JSON Patch {@code test} failed, a path does not exist, or the patch
 * changes a read only attribute: the {@code invalid-patch} problem.
 */
public class InvalidPatchException extends ProblemException {

    public InvalidPatchException(String pointer, String detail) {
        this(List.of(new FieldProblem(pointer, detail)));
    }

    public InvalidPatchException(List<FieldProblem> errors) {
        super(ProblemType.INVALID_PATCH, errors.size() == 1
                ? errors.getFirst().pointer() + ": " + errors.getFirst().detail()
                : errors.size() + " parts of the patch cannot be applied; see errors.", errors);
    }
}
