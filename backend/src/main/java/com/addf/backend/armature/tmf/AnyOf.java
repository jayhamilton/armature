package com.addf.backend.armature.tmf;

import java.util.List;
import java.util.stream.Stream;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import tools.jackson.databind.JsonNode;

/**
 * Satisfied when the value at {@link #path()} equals one of {@link #values()}: {@code state=DRAFT}
 * (one value) or {@code state=DRAFT,PUBLISHED} (either). When the path crosses an array, any
 * element may match.
 */
@DesignPattern(pattern = Pattern.INTERPRETER_SPECIFICATION, role = "TerminalExpression",
        doc = "docs/patterns/interpreter-specification.md")
public record AnyOf(String path, List<String> values) implements Specification {

    public AnyOf {
        values = List.copyOf(values);
    }

    @Override
    public boolean isSatisfiedBy(JsonNode resource) {
        return JsonValues.at(resource, path).stream()
                .anyMatch(actual -> values.stream().anyMatch(value -> JsonValues.compare(actual, value) == 0));
    }

    @Override
    public Stream<String> paths() {
        return Stream.of(path);
    }
}
