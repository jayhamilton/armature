package com.addf.backend.armature.tmf;

import java.util.Arrays;
import java.util.Optional;
import java.util.function.IntPredicate;
import java.util.stream.Stream;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import tools.jackson.databind.JsonNode;

/**
 * Satisfied when the value at {@link #path()} compares to {@link #value()} as the operator says:
 * {@code lastUpdate.gt=2026-10-01}, {@code version.lte=3}, {@code state.ne=ARCHIVED}.
 * Values compare as numbers, then as dates, then as text (see {@link JsonValues#compare}).
 */
@DesignPattern(pattern = Pattern.INTERPRETER_SPECIFICATION, role = "TerminalExpression",
        doc = "docs/patterns/interpreter-specification.md")
public record Compare(String path, Operator operator, String value) implements Specification {

    /** The TMF 630 operator suffixes. Each knows how to read a comparison result. */
    public enum Operator {
        GT("gt", order -> order > 0),
        GTE("gte", order -> order >= 0),
        LT("lt", order -> order < 0),
        LTE("lte", order -> order <= 0),
        NE("ne", order -> order != 0);

        private final String suffix;
        private final IntPredicate accepts;

        Operator(String suffix, IntPredicate accepts) {
            this.suffix = suffix;
            this.accepts = accepts;
        }

        public String suffix() {
            return suffix;
        }

        /** The operator for a parameter suffix such as {@code gte}, if it is one. */
        public static Optional<Operator> forSuffix(String suffix) {
            return Arrays.stream(values()).filter(operator -> operator.suffix.equals(suffix)).findFirst();
        }
    }

    @Override
    public boolean isSatisfiedBy(JsonNode resource) {
        var actual = JsonValues.at(resource, path);
        if (operator == Operator.NE) {
            // "Not equal" holds when no value equals, including when the attribute is absent.
            return actual.stream().allMatch(node -> operator.accepts.test(JsonValues.compare(node, value)));
        }
        return actual.stream().anyMatch(node -> operator.accepts.test(JsonValues.compare(node, value)));
    }

    @Override
    public Stream<String> paths() {
        return Stream.of(path);
    }
}
