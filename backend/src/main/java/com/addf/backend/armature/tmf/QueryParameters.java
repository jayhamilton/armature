package com.addf.backend.armature.tmf;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * A TMF 630 query string, parsed: attribute selection, filters, sort order, and the page.
 *
 * @param fields the attributes to return, or {@code null} for all of them; {@code id}, {@code href},
 *               and {@code @type} are always returned
 * @param filter the filters, combined
 * @param sort the sort keys, in order of priority
 * @param offset how many matching resources to skip
 * @param limit the most resources to return
 */
public record QueryParameters(Set<String> fields, Specification filter, List<SortKey> sort, int offset, int limit) {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 100;

    /** One sort key: {@code title} ascending, {@code -lastUpdate} descending. */
    public record SortKey(String path, boolean descending) {
    }

    private static final Set<String> RESERVED = Set.of("fields", "sort", "offset", "limit");

    /** Parses a request's query parameters; every name that is not reserved is a filter. */
    public static QueryParameters parse(Map<String, List<String>> query) {
        Map<String, List<String>> filters = new LinkedHashMap<>(query);
        filters.keySet().removeAll(RESERVED);
        return new QueryParameters(
                fields(query.get("fields")),
                FilterParser.parse(filters),
                sort(query.get("sort")),
                integer(query, "offset", 0, Integer.MAX_VALUE),
                integer(query, "limit", DEFAULT_LIMIT, MAX_LIMIT));
    }

    /** Only {@code fields}, for reading a single resource. */
    public static QueryParameters fieldsOnly(Map<String, List<String>> query) {
        return new QueryParameters(fields(query.get("fields")), new AllOf(List.of()), List.of(), 0, MAX_LIMIT);
    }

    private static Set<String> fields(List<String> values) {
        if (values == null) {
            return null;
        }
        Set<String> fields = new LinkedHashSet<>();
        values.forEach(value -> fields.addAll(split(value)));
        fields.remove("none");
        return fields;
    }

    private static List<SortKey> sort(List<String> values) {
        List<SortKey> keys = new ArrayList<>();
        if (values != null) {
            values.forEach(value -> split(value).forEach(key -> keys.add(key.startsWith("-")
                    ? new SortKey(key.substring(1), true)
                    : new SortKey(key.startsWith("+") ? key.substring(1) : key, false))));
        }
        return keys;
    }

    private static int integer(Map<String, List<String>> query, String name, int fallback, int max) {
        List<String> values = query.get(name);
        if (values == null || values.isEmpty()) {
            return fallback;
        }
        try {
            int value = Integer.parseInt(values.getFirst());
            if (value < 0 || value > max) {
                throw new InvalidQueryException(name, "must be between 0 and " + max + ".");
            }
            return value;
        } catch (NumberFormatException notANumber) {
            throw new InvalidQueryException(name, "'" + values.getFirst() + "' is not a whole number.");
        }
    }

    private static List<String> split(String value) {
        return Arrays.stream(value.split(",")).map(String::trim).filter(part -> !part.isEmpty()).toList();
    }
}
