package com.addf.backend.armature.tmf;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** The TMF 630 query rules on plain records, without HTTP. */
class QueryEngineTest {

    record Ref(String id) {
    }

    record Item(String id, String href, String title, int size, String created, List<Ref> parts) {
    }

    private static final Set<String> ATTRIBUTES = Set.of("id", "href", "title", "size", "created", "parts");

    private final QueryEngine engine = new QueryEngine(JsonMapper.builder().build());

    private final List<Item> items = List.of(
            new Item("1", "/item/1", "pear", 3, "2026-10-01T09:00:00Z", List.of(new Ref("a"))),
            new Item("2", "/item/2", "apple", 10, "2026-10-03T09:00:00Z", List.of(new Ref("b"), new Ref("c"))),
            new Item("3", "/item/3", "fig", 3, "2026-10-02T09:00:00Z", List.of()));

    @Test
    void equalityAndAnyOf() {
        assertThat(ids(Map.of("title", List.of("fig")))).containsExactly("3");
        assertThat(ids(Map.of("title", List.of("fig,pear")))).containsExactly("1", "3");
    }

    @Test
    void numbersCompareAsNumbersAndDatesAsDates() {
        assertThat(ids(Map.of("size.gt", List.of("3")))).containsExactly("2");
        assertThat(ids(Map.of("size.gte", List.of("3")))).containsExactly("1", "2", "3");
        assertThat(ids(Map.of("created.lt", List.of("2026-10-02")))).containsExactly("1");
        assertThat(ids(Map.of("created.lte", List.of("2026-10-02T09:00:00Z")))).containsExactly("1", "3");
        assertThat(ids(Map.of("size.ne", List.of("3")))).containsExactly("2");
    }

    @Test
    void dottedPathsReachIntoNestedObjectsAndArrays() {
        assertThat(ids(Map.of("parts.id", List.of("c")))).containsExactly("2");
    }

    @Test
    void severalFiltersMustAllHold() {
        assertThat(ids(Map.of("size", List.of("3"), "title.ne", List.of("pear")))).containsExactly("3");
    }

    @Test
    void sortByKeysInPriorityOrder() {
        assertThat(ids(Map.of("sort", List.of("title")))).containsExactly("2", "3", "1");
        assertThat(ids(Map.of("sort", List.of("size,-created")))).containsExactly("3", "1", "2");
    }

    @Test
    void offsetAndLimitPageTheMatches() {
        Page page = engine.apply(items, QueryParameters.parse(Map.of("sort", List.of("id"), "offset", List.of("1"),
                "limit", List.of("1"))), ATTRIBUTES);
        assertThat(page.items()).extracting(item -> item.get("id").asString()).containsExactly("2");
        assertThat(page.totalCount()).isEqualTo(3);
        assertThat(page.isPartial()).isTrue();
    }

    @Test
    void fieldsKeepsTheNamedAttributesAndAlwaysIdAndHref() {
        JsonNode first = engine.apply(items, QueryParameters.parse(Map.of("fields", List.of("title"))), ATTRIBUTES)
                .items().getFirst();
        assertThat(first.propertyNames()).containsExactlyInAnyOrder("id", "href", "title");
    }

    @Test
    void unknownAttributesAndBadNumbersAreInvalidQueries() {
        assertThatThrownBy(() -> ids(Map.of("sort", List.of("colour")))).isInstanceOf(InvalidQueryException.class)
                .hasMessageContaining("colour");
        assertThatThrownBy(() -> ids(Map.of("colour", List.of("red")))).isInstanceOf(InvalidQueryException.class);
        assertThatThrownBy(() -> ids(Map.of("limit", List.of("101")))).isInstanceOf(InvalidQueryException.class);
        assertThatThrownBy(() -> ids(Map.of("offset", List.of("-1")))).isInstanceOf(InvalidQueryException.class);
    }

    private List<String> ids(Map<String, List<String>> query) {
        return engine.apply(items, QueryParameters.parse(query), ATTRIBUTES).items().stream()
                .map(item -> item.get("id").asString()).toList();
    }
}
