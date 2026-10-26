package com.addf.backend.armature.board;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.InvalidRequestException;

/**
 * The layouts a board row can have, and how many columns each one has. The values are the ones
 * the web hosts already store ({@code LayoutType} in each host), so a board moves between the UI
 * and the API unchanged.
 */
public enum RowLayout {

    ONE_COL("one_col", 1),
    ONE_COL_FULL("one_col_full", 1),
    TWO_COL_EQUAL("two_col_equal", 2),
    TWO_COL_NARROW_WIDE("two_col_narrow_wide", 2),
    TWO_COL_WIDE_NARROW("two_col_wide_narrow", 2),
    THREE_COL_EQUAL("three_col_equal", 3),
    MASONRY("masonry", 4);

    private final String value;
    private final int columnCount;

    RowLayout(String value, int columnCount) {
        this.value = value;
        this.columnCount = columnCount;
    }

    /** The name used in resources, for example {@code two_col_equal}. */
    public String value() {
        return value;
    }

    public int columnCount() {
        return columnCount;
    }

    public static Optional<RowLayout> fromValue(String value) {
        return Arrays.stream(values()).filter(layout -> layout.value.equals(value)).findFirst();
    }

    /**
     * The layout named by a request.
     *
     * @param pointer where the value sits in the request, for the error
     * @throws InvalidRequestException if no layout has that name
     */
    public static RowLayout parse(String value, String pointer) {
        return fromValue(value).orElseThrow(() -> new InvalidRequestException(List.of(new FieldProblem(pointer,
                "'" + value + "' is not a row layout; use one of "
                        + String.join(", ", Arrays.stream(values()).map(RowLayout::value).toList()) + "."))));
    }
}
