package com.addf.backend.armature.board;

import static com.addf.backend.armature.board.BoardApiTest.body;
import static com.addf.backend.armature.problem.ProblemAssertions.expectProblem;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import com.addf.backend.armature.ApiTest;
import com.addf.backend.armature.problem.ProblemType;
import com.addf.backend.armature.tmf.PatchStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

/** TMF 630 conformance for {@code /board/{id}/row} and {@code /gadgetInstance}. */
class RowAndGadgetInstanceApiTest extends ApiTest {

    private String boardId;
    private String rowId;

    @BeforeEach
    void boardWithOneTwoColumnRow() {
        JsonNode board = body(client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("{\"title\": \"Services\", \"rows\": [{\"structure\": \"two_col_equal\"}]}").exchange());
        boardId = board.get("id").asString();
        rowId = board.get("rows").get(0).get("id").asString();
    }

    @Test
    void rowsAreAResourceOfTheirBoard() {
        var created = client.post().uri("/board/{id}/row", boardId).contentType(MediaType.APPLICATION_JSON)
                .body("{\"structure\": \"three_col_equal\"}").exchange();
        created.expectStatus().isCreated();
        JsonNode row = body(created);
        assertThat(row.get("columns")).hasSize(3);
        created.expectHeader().valueEquals("Location", row.get("href").asString());

        var list = client.get().uri("/board/{id}/row?structure=three_col_equal&fields=structure", boardId).exchange();
        list.expectHeader().valueEquals("X-Total-Count", "1");
        assertThat(body(list).get(0).propertyNames()).containsExactlyInAnyOrder("id", "href", "@type", "structure");

        assertThat(body(client.get().uri(row.get("href").asString()).exchange()).get("id").asString())
                .isEqualTo(row.get("id").asString());
    }

    @Test
    void gadgetInstancesArePlacedAndListedByBoard() {
        JsonNode first = place("BarChartGadget", "Usage", 0, null);
        JsonNode second = place("TableGadget", "Bills", 0, 0);

        assertThat(first.get("href").asString()).isEqualTo("/gadgetInstance/" + first.get("id").asString());
        assertThat(first.get("@baseType").asString()).isEqualTo("GadgetInstance");
        assertThat(first.get("board").get("href").asString()).isEqualTo("/board/" + boardId);
        assertThat(second.get("order").asInt()).isZero();

        List<String> titles = body(client.get().uri("/gadgetInstance?board.id={id}&sort=order", boardId).exchange())
                .values().stream().map(gadget -> gadget.get("title").asString()).toList();
        assertThat(titles).containsExactly("Bills", "Usage");

        JsonNode row = body(client.get().uri("/board/{b}/row/{r}", boardId, rowId).exchange());
        assertThat(row.get("columns").get(0).get("gadgetInstance").get(0).get("id").asString())
                .isEqualTo(second.get("id").asString());

        assertThat(body(client.get().uri("/gadgetInstance?board.id={id}&@type=TableGadget", boardId).exchange()))
                .hasSize(1);
    }

    @Test
    void patchingAGadgetInstanceMovesIt() {
        JsonNode gadget = place("BarChartGadget", "Usage", 0, null);
        JsonNode moved = body(client.patch().uri(gadget.get("href").asString())
                .contentType(MediaType.parseMediaType(PatchStrategy.MERGE_PATCH_JSON))
                .body("{\"column\": 1, \"properties\": {\"showLegend\": true}}").exchange());
        assertThat(moved.get("column").asInt()).isEqualTo(1);
        assertThat(moved.get("properties").get("showLegend").asBoolean()).isTrue();

        expectProblem(client.patch().uri(gadget.get("href").asString())
                .contentType(MediaType.parseMediaType(PatchStrategy.MERGE_PATCH_JSON))
                .body("{\"column\": 5}").exchange(), ProblemType.INVALID_REQUEST)
                .jsonPath("$.errors[0].pointer").isEqualTo("/column");
        expectProblem(client.patch().uri(gadget.get("href").asString())
                .contentType(MediaType.parseMediaType(PatchStrategy.JSON_PATCH_JSON))
                .body("[{\"op\": \"replace\", \"path\": \"/@type\", \"value\": \"TableGadget\"}]").exchange(),
                ProblemType.INVALID_PATCH);
    }

    @Test
    void narrowingARowKeepsItsGadgets() {
        place("BarChartGadget", "Left", 0, null);
        place("TableGadget", "Right", 1, null);
        JsonNode row = body(client.patch().uri("/board/{b}/row/{r}", boardId, rowId)
                .contentType(MediaType.parseMediaType(PatchStrategy.MERGE_PATCH_JSON))
                .body("{\"structure\": \"one_col\"}").exchange());
        assertThat(row.get("columns")).hasSize(1);
        assertThat(row.get("columns").get(0).get("gadgetInstance")).hasSize(2);
    }

    @Test
    void removingARowRemovesItsGadgetInstances() {
        JsonNode gadget = place("BarChartGadget", "Usage", 0, null);
        client.delete().uri("/board/{b}/row/{r}", boardId, rowId).exchange().expectStatus().isNoContent();
        expectProblem(client.get().uri(gadget.get("href").asString()).exchange(), ProblemType.RESOURCE_NOT_FOUND);
    }

    @Test
    void deletingAGadgetInstanceTakesItOffItsBoard() {
        JsonNode gadget = place("BarChartGadget", "Usage", 0, null);
        client.delete().uri(gadget.get("href").asString()).exchange().expectStatus().isNoContent();
        assertThat(body(client.get().uri("/gadgetInstance?board.id={id}", boardId).exchange())).isEmpty();
    }

    @Test
    void aGadgetInstanceMustNameItsTypeBoardAndRow() {
        expectProblem(client.post().uri("/gadgetInstance").contentType(MediaType.APPLICATION_JSON).body("{}")
                .exchange(), ProblemType.INVALID_REQUEST)
                .jsonPath("$.errors.length()").isEqualTo(3);
        expectProblem(client.post().uri("/gadgetInstance").contentType(MediaType.APPLICATION_JSON)
                .body("{\"@type\": \"BarChartGadget\", \"board\": {\"id\": \"%s\"}, \"row\": {\"id\": \"nope\"}}"
                        .formatted(boardId)).exchange(), ProblemType.INVALID_REQUEST)
                .jsonPath("$.errors[0].pointer").isEqualTo("/row/id");
        expectProblem(client.post().uri("/board/{id}/row", boardId).contentType(MediaType.APPLICATION_JSON)
                .body("{\"structure\": \"five_col\"}").exchange(), ProblemType.INVALID_REQUEST);
    }

    private JsonNode place(String type, String title, int column, Integer order) {
        var response = client.post().uri("/gadgetInstance").contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"@type": "%s", "title": "%s", "board": {"id": "%s"}, "row": {"id": "%s"},
                         "column": %d, "order": %s, "properties": {"chartType": "bar"}}
                        """.formatted(type, title, boardId, rowId, column, order))
                .exchange();
        response.expectStatus().isCreated();
        return body(response);
    }
}
