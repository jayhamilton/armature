package com.addf.backend.armature.board;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.InvalidRequestException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * The parts of a board its owner describes and may change at any time: what the board is called,
 * says, and looks like. Everything else about a board is decided by the server.
 *
 * @param contentWidth the side padding preset: {@code full}, {@code normal}, or {@code narrow}
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record BoardDetails(String title, String description, String icon, String contentWidth) {

    static final Set<String> CONTENT_WIDTHS = Set.of("full", "normal", "narrow");

    /** @throws InvalidRequestException naming every rule broken */
    BoardDetails validated() {
        List<FieldProblem> problems = new ArrayList<>();
        if (title == null || title.isBlank()) {
            problems.add(new FieldProblem("/title", "a board needs a title."));
        }
        if (contentWidth != null && !CONTENT_WIDTHS.contains(contentWidth)) {
            problems.add(new FieldProblem("/contentWidth", "must be full, normal, or narrow."));
        }
        if (!problems.isEmpty()) {
            throw new InvalidRequestException(problems);
        }
        return this;
    }
}
