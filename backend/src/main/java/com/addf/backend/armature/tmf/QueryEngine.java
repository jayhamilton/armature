package com.addf.backend.armature.tmf;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

/**
 * Applies a TMF 630 query to resources: filter, sort, page, then select fields. It works on each
 * resource's JSON representation, so every resource gets the same rules with no code of its own.
 *
 * <p>Attribute names are checked against the resource's declared attributes, so a typo such as
 * {@code sort=titel} is an {@code invalid-query} problem rather than a silently unsorted list.
 */
@Component
public class QueryEngine {

    /** Returned whatever {@code fields} says (TMF 630). */
    public static final Set<String> ALWAYS_RETURNED = Set.of("id", "href", "@type");

    private final JsonMapper mapper;

    public QueryEngine(JsonMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * @param resources the representations to query, in their natural order
     * @param attributes the top level attribute names these resources have
     */
    public Page apply(Collection<?> resources, QueryParameters query, Set<String> attributes) {
        checkAttributes(query, attributes);
        List<JsonNode> matching = resources.stream()
                .map(resource -> (JsonNode) mapper.valueToTree(resource))
                .filter(query.filter()::isSatisfiedBy)
                .sorted(comparator(query.sort()))
                .toList();
        List<JsonNode> page = matching.stream()
                .skip(query.offset())
                .limit(query.limit())
                .map(resource -> select(resource, query.fields()))
                .toList();
        return new Page(page, matching.size());
    }

    /** Applies only {@code fields} to one resource, for {@code GET /resource/{id}}. */
    public JsonNode select(Object resource, QueryParameters query, Set<String> attributes) {
        checkAttributes(query, attributes);
        return select(mapper.valueToTree(resource), query.fields());
    }

    private static JsonNode select(JsonNode resource, Set<String> fields) {
        if (fields == null) {
            return resource;
        }
        ObjectNode selected = ((ObjectNode) resource).objectNode();
        resource.properties().forEach(property -> {
            if (ALWAYS_RETURNED.contains(property.getKey()) || fields.contains(property.getKey())) {
                selected.set(property.getKey(), property.getValue());
            }
        });
        return selected;
    }

    private static Comparator<JsonNode> comparator(List<QueryParameters.SortKey> keys) {
        Comparator<JsonNode> comparator = (a, b) -> 0;
        for (QueryParameters.SortKey key : keys) {
            Comparator<JsonNode> byKey = Comparator.comparing(
                    (JsonNode resource) -> first(resource, key.path()), JsonValues.ORDER);
            comparator = comparator.thenComparing(key.descending() ? byKey.reversed() : byKey);
        }
        return comparator;
    }

    private static Optional<JsonNode> first(JsonNode resource, String path) {
        return JsonValues.at(resource, path).stream().findFirst();
    }

    private static void checkAttributes(QueryParameters query, Set<String> attributes) {
        List<String> unknown = new ArrayList<>();
        Stream.concat(
                        query.fields() == null ? Stream.empty() : query.fields().stream(),
                        Stream.concat(query.sort().stream().map(QueryParameters.SortKey::path), query.filter().paths()))
                .map(path -> path.split("\\.")[0])
                .filter(name -> !attributes.contains(name) && !unknown.contains(name))
                .forEach(unknown::add);
        if (!unknown.isEmpty()) {
            throw new InvalidQueryException(unknown.getFirst(), "this resource has no attribute '"
                    + unknown.getFirst() + "'. Known attributes: " + String.join(", ", attributes.stream().sorted().toList())
                    + ".");
        }
    }
}
