package com.addf.backend.armature.tmf;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import tools.jackson.databind.JsonNode;

/**
 * How TMF 630 queries read and compare values in a resource's JSON tree. One set of rules for
 * filters and sorting, so {@code lastUpdate.gt=} and {@code sort=lastUpdate} always agree.
 */
final class JsonValues {

    private JsonValues() {
    }

    /**
     * The values at a dotted path such as {@code board.id}. When the path crosses an array, every
     * element is followed, so {@code rows.structure} yields the structure of each row.
     */
    static List<JsonNode> at(JsonNode root, String path) {
        List<JsonNode> current = List.of(root);
        for (String name : path.split("\\.")) {
            List<JsonNode> next = new ArrayList<>();
            for (JsonNode node : current) {
                collect(node.get(name), next);
            }
            current = next;
        }
        return current;
    }

    private static void collect(JsonNode node, List<JsonNode> into) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isArray()) {
            node.values().forEach(element -> collect(element, into));
        } else {
            into.add(node);
        }
    }

    /**
     * Compares a resource value with a query value: as numbers when both are numbers, as instants
     * when both are ISO 8601 dates or date times, otherwise as text.
     */
    static int compare(JsonNode actual, String expected) {
        String text = actual.asString();
        Optional<BigDecimal> expectedNumber = number(expected);
        if (actual.isNumber() && expectedNumber.isPresent()) {
            return actual.decimalValue().compareTo(expectedNumber.get());
        }
        Optional<Instant> actualInstant = instant(text);
        Optional<Instant> expectedInstant = instant(expected);
        if (actualInstant.isPresent() && expectedInstant.isPresent()) {
            return actualInstant.get().compareTo(expectedInstant.get());
        }
        return text.compareTo(expected);
    }

    /** Orders two resource values by the same rules as {@link #compare}; missing values sort last. */
    static final Comparator<Optional<JsonNode>> ORDER = (left, right) -> {
        if (left.isEmpty() || right.isEmpty()) {
            return Boolean.compare(left.isEmpty(), right.isEmpty());
        }
        JsonNode a = left.get();
        JsonNode b = right.get();
        if (a.isNumber() && b.isNumber()) {
            return a.decimalValue().compareTo(b.decimalValue());
        }
        return compare(a, b.asString());
    };

    private static Optional<BigDecimal> number(String text) {
        try {
            return Optional.of(new BigDecimal(text));
        } catch (NumberFormatException notANumber) {
            return Optional.empty();
        }
    }

    private static Optional<Instant> instant(String text) {
        try {
            return Optional.of(Instant.parse(text));
        } catch (DateTimeParseException notAnInstant) {
            try {
                return Optional.of(LocalDate.parse(text).atStartOfDay().toInstant(ZoneOffset.UTC));
            } catch (DateTimeParseException notADate) {
                return Optional.empty();
            }
        }
    }
}
