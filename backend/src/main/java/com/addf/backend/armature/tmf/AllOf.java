package com.addf.backend.armature.tmf;

import java.util.List;
import java.util.stream.Stream;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import tools.jackson.databind.JsonNode;

/**
 * Satisfied when every part is: the filters of one query string, joined by {@code &}.
 * An empty {@code AllOf} matches everything, which is a query with no filters.
 */
@DesignPattern(pattern = Pattern.INTERPRETER_SPECIFICATION, role = "NonterminalExpression",
        doc = "docs/patterns/interpreter-specification.md")
public record AllOf(List<Specification> parts) implements Specification {

    public AllOf {
        parts = List.copyOf(parts);
    }

    @Override
    public boolean isSatisfiedBy(JsonNode resource) {
        return parts.stream().allMatch(part -> part.isSatisfiedBy(resource));
    }

    @Override
    public Stream<String> paths() {
        return parts.stream().flatMap(Specification::paths);
    }
}
