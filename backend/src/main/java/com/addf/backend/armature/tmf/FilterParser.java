package com.addf.backend.armature.tmf;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;

/**
 * Parses the filter parameters of a query string into one {@link Specification}.
 *
 * <ul>
 * <li>{@code attr=value} and {@code attr=a,b}: {@link AnyOf}</li>
 * <li>{@code attr.gt=}, {@code .gte=}, {@code .lt=}, {@code .lte=}, {@code .ne=}: {@link Compare}</li>
 * <li>several parameters: {@link AllOf} of them</li>
 * </ul>
 *
 * A parameter whose last dotted segment is not an operator is a path, so {@code board.id=7} filters
 * on the nested {@code id}.
 */
@DesignPattern(pattern = Pattern.INTERPRETER_SPECIFICATION, role = "Parser",
        doc = "docs/patterns/interpreter-specification.md")
final class FilterParser {

    private FilterParser() {
    }

    static Specification parse(Map<String, List<String>> filters) {
        List<Specification> parts = new ArrayList<>();
        filters.forEach((parameter, values) -> values.forEach(value -> parts.add(parseOne(parameter, value))));
        return new AllOf(parts);
    }

    private static Specification parseOne(String parameter, String value) {
        int dot = parameter.lastIndexOf('.');
        Optional<Compare.Operator> operator = dot < 0
                ? Optional.empty()
                : Compare.Operator.forSuffix(parameter.substring(dot + 1));
        if (operator.isEmpty()) {
            return new AnyOf(parameter, Arrays.asList(value.split(",", -1)));
        }
        if (value.contains(",")) {
            throw new InvalidQueryException(parameter, "the ." + operator.get().suffix()
                    + " operator takes one value, not a list.");
        }
        return new Compare(parameter.substring(0, dot), operator.get(), value);
    }
}
