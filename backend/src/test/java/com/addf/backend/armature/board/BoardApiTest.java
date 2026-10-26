package com.addf.backend.armature.board;

import static com.addf.backend.armature.problem.ProblemAssertions.expectProblem;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import com.addf.backend.armature.ApiTest;
import com.addf.backend.armature.problem.ProblemType;
import com.addf.backend.armature.problem.ProducesProblem;
import com.addf.backend.armature.tmf.PatchStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * TMF 630 conformance for {@code /board} (the rules in {@code docs/api/tmf630-conformance.md}):
 * identity, creation, attribute selection, filtering, sorting, pagination, both PATCH media types,
 * and the problems each rule raises when broken.
 */
class BoardApiTest extends ApiTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    /** Tags this test's boards, so filters see only them (the context is shared). */
    private String run;

    @BeforeEach
    void newRun() {
        run = "run-" + UUID.randomUUID();
    }

    @Test
    void createReturns201WithLocationIdHrefTypeAndDraftState() {
        var response = client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("""
                        {"title": "Network overview", "description": "%s", "rows": [{"structure": "two_col_equal"}]}
                        """.formatted(run))
                .exchange();
        response.expectStatus().isCreated();
        JsonNode board = body(response);
        response.expectHeader().valueEquals("Location", "/board/" + board.get("id").asString());
        assertThat(board.get("href").asString()).isEqualTo("/board/" + board.get("id").asString());
        assertThat(board.get("@type").asString()).isEqualTo("Board");
        assertThat(board.get("state").asString()).isEqualTo("DRAFT");
        assertThat(board.get("version").asInt()).isEqualTo(1);
        JsonNode row = board.get("rows").get(0);
        assertThat(row.get("href").asString()).isEqualTo(board.get("href").asString() + "/row/" + row.get("id").asString());
        assertThat(row.get("@type").asString()).isEqualTo("BoardRow");
        assertThat(row.get("columns")).hasSize(2);
    }

    @Test
    void readReturnsTheBoardAndFieldsSelectsAttributes() {
        String id = create("Billing", 0).get("id").asString();

        assertThat(body(client.get().uri("/board/{id}", id).exchange()).get("title").asString()).isEqualTo("Billing");

        JsonNode selected = body(client.get().uri("/board/{id}?fields=title,state", id).exchange());
        assertThat(selected.propertyNames()).containsExactlyInAnyOrder("id", "href", "@type", "title", "state");

        JsonNode none = body(client.get().uri("/board/{id}?fields=none", id).exchange());
        assertThat(none.propertyNames()).containsExactlyInAnyOrder("id", "href", "@type");
    }

    @Test
    void filtersMatchByEqualityAnyOfAndOperators() {
        create("Alpha", 0);
        String beta = create("Beta", 0).get("id").asString();
        create("Gamma", 0);
        patch(beta, PatchStrategy.MERGE_PATCH_JSON, "{\"icon\": \"star\"}");

        assertThat(titles("/board?description=" + run + "&title=Beta")).containsExactly("Beta");
        assertThat(titles("/board?description=" + run + "&title=Alpha,Gamma&sort=title")).containsExactly("Alpha", "Gamma");
        assertThat(titles("/board?description=" + run + "&version.gt=1")).containsExactly("Beta");
        assertThat(titles("/board?description=" + run + "&version.lte=1&sort=title")).containsExactly("Alpha", "Gamma");
        assertThat(titles("/board?description=" + run + "&title.ne=Beta&sort=title")).containsExactly("Alpha", "Gamma");
        assertThat(titles("/board?description=" + run + "&state=DRAFT")).hasSize(3);
    }

    @Test
    void sortTakesSeveralKeysAndDescendingOrder() {
        String b = create("B", 0).get("id").asString();
        create("A", 0);
        create("C", 0);
        patch(b, PatchStrategy.MERGE_PATCH_JSON, "{\"icon\": \"star\"}");

        assertThat(titles("/board?description=" + run + "&sort=-title")).containsExactly("C", "B", "A");
        assertThat(titles("/board?description=" + run + "&sort=-version,title")).containsExactly("B", "A", "C");
    }

    @Test
    void aPartialPageIs206WithBothCountHeaders() {
        for (int i = 0; i < 5; i++) {
            create("Board " + i, 0);
        }
        var partial = client.get().uri("/board?description=" + run + "&sort=title&offset=1&limit=2").exchange();
        partial.expectStatus().isEqualTo(206);
        partial.expectHeader().valueEquals("X-Total-Count", "5");
        partial.expectHeader().valueEquals("X-Result-Count", "2");
        assertThat(titlesOf(body(partial))).containsExactly("Board 1", "Board 2");

        var whole = client.get().uri("/board?description=" + run).exchange();
        whole.expectStatus().isOk();
        whole.expectHeader().valueEquals("X-Total-Count", "5");
        whole.expectHeader().valueEquals("X-Result-Count", "5");
    }

    @Test
    void mergePatchChangesOnlyWhatItNames() {
        String id = create("Before", 0).get("id").asString();
        JsonNode patched = body(patch(id, PatchStrategy.MERGE_PATCH_JSON, "{\"title\": \"After\", \"icon\": \"star\"}"));
        assertThat(patched.get("title").asString()).isEqualTo("After");
        assertThat(patched.get("icon").asString()).isEqualTo("star");
        assertThat(patched.get("description").asString()).isEqualTo(run);
        assertThat(patched.get("version").asInt()).isEqualTo(2);

        JsonNode removed = body(patch(id, PatchStrategy.MERGE_PATCH_JSON, "{\"icon\": null}"));
        assertThat(removed.has("icon")).isFalse();
    }

    @Test
    void jsonPatchAppliesOperationsInOrder() {
        String id = create("Before", 0).get("id").asString();
        JsonNode patched = body(patch(id, PatchStrategy.JSON_PATCH_JSON, """
                [{"op": "test", "path": "/title", "value": "Before"},
                 {"op": "replace", "path": "/title", "value": "After"},
                 {"op": "add", "path": "/contentWidth", "value": "narrow"}]
                """));
        assertThat(patched.get("title").asString()).isEqualTo("After");
        assertThat(patched.get("contentWidth").asString()).isEqualTo("narrow");
    }

    @Test
    @ProducesProblem("invalid-patch")
    void aFailedTestOperationChangesNothing() {
        String id = create("Current", 0).get("id").asString();
        expectProblem(patch(id, PatchStrategy.JSON_PATCH_JSON, """
                [{"op": "replace", "path": "/title", "value": "Mine"},
                 {"op": "test", "path": "/title", "value": "Stale"}]
                """), ProblemType.INVALID_PATCH)
                .jsonPath("$.errors[0].pointer").isEqualTo("/1");
        assertThat(body(client.get().uri("/board/{id}", id).exchange()).get("title").asString()).isEqualTo("Current");
    }

    @Test
    void aPatchMayNotChangeReadOnlyAttributes() {
        String id = create("Board", 0).get("id").asString();
        expectProblem(patch(id, PatchStrategy.MERGE_PATCH_JSON, "{\"state\": \"LOCKED\", \"version\": 9}"),
                ProblemType.INVALID_PATCH)
                .jsonPath("$.errors[*].pointer").value(pointers -> assertThat(pointers.toString())
                        .contains("/state", "/version"));
    }

    @Test
    @ProducesProblem("unsupported-media-type")
    void patchAcceptsOnlyThePatchMediaTypes() {
        String id = create("Board", 0).get("id").asString();
        expectProblem(client.patch().uri("/board/{id}", id).contentType(MediaType.APPLICATION_JSON)
                .body("{\"title\": \"x\"}").exchange(), ProblemType.UNSUPPORTED_MEDIA_TYPE);
    }

    @Test
    @ProducesProblem("resource-not-found")
    void anUnknownBoardIsResourceNotFound() {
        expectProblem(client.get().uri("/board/no-such-board").exchange(), ProblemType.RESOURCE_NOT_FOUND)
                .jsonPath("$.instance").isEqualTo("/board/no-such-board")
                .jsonPath("$.detail").isEqualTo("There is no board with id 'no-such-board'.");
    }

    @Test
    void aTraceparentBecomesTheProblemsTraceId() {
        expectProblem(client.get().uri("/board/no-such-board")
                .header("traceparent", "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01").exchange(),
                ProblemType.RESOURCE_NOT_FOUND)
                .jsonPath("$.traceId").isEqualTo("4bf92f3577b34da6a3ce929d0e0e4736");
    }

    @Test
    @ProducesProblem("invalid-query")
    void aBadQueryParameterIsInvalidQuery() {
        expectProblem(client.get().uri("/board?limit=500").exchange(), ProblemType.INVALID_QUERY)
                .jsonPath("$.errors[0].pointer").isEqualTo("/query/limit");
        expectProblem(client.get().uri("/board?sort=titel").exchange(), ProblemType.INVALID_QUERY)
                .jsonPath("$.errors[0].pointer").isEqualTo("/query/titel");
        expectProblem(client.get().uri("/board?offset=first").exchange(), ProblemType.INVALID_QUERY);
        expectProblem(client.get().uri("/board?version.gt=1,2").exchange(), ProblemType.INVALID_QUERY);
    }

    @Test
    @ProducesProblem("invalid-request")
    void aBoardWithoutATitleIsInvalidRequest() {
        expectProblem(client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("{\"contentWidth\": \"huge\", \"rows\": [{\"structure\": \"five_col\"}]}").exchange(),
                ProblemType.INVALID_REQUEST)
                .jsonPath("$.errors[0].pointer").isEqualTo("/rows/0/structure");
        expectProblem(client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("{\"contentWidth\": \"huge\"}").exchange(), ProblemType.INVALID_REQUEST)
                .jsonPath("$.errors.length()").isEqualTo(2);
        expectProblem(client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("{not json").exchange(), ProblemType.INVALID_REQUEST);
    }

    @Test
    @ProducesProblem("method-not-allowed")
    void putIsNotOffered() {
        String id = create("Board", 0).get("id").asString();
        var response = client.put().uri("/board/{id}", id).contentType(MediaType.APPLICATION_JSON).body("{}").exchange();
        expectProblem(response, ProblemType.METHOD_NOT_ALLOWED);
        response.expectHeader().exists("Allow");
    }

    @Test
    @ProducesProblem("not-acceptable")
    void boardsAreOnlyJson() {
        expectProblem(client.get().uri("/board").accept(MediaType.parseMediaType("text/csv"),
                MediaType.APPLICATION_PROBLEM_JSON).exchange(), ProblemType.NOT_ACCEPTABLE);
    }

    @Test
    void deleteRemovesTheBoard() {
        String id = create("Doomed", 0).get("id").asString();
        client.delete().uri("/board/{id}", id).exchange().expectStatus().isNoContent();
        expectProblem(client.get().uri("/board/{id}", id).exchange(), ProblemType.RESOURCE_NOT_FOUND);
        expectProblem(client.delete().uri("/board/{id}", id).exchange(), ProblemType.RESOURCE_NOT_FOUND);
    }

    private JsonNode create(String title, int rows) {
        String rowList = String.join(",", Collections.nCopies(rows, "{\"structure\": \"two_col_equal\"}"));
        var response = client.post().uri("/board").contentType(MediaType.APPLICATION_JSON)
                .body("{\"title\": \"%s\", \"description\": \"%s\", \"rows\": [%s]}".formatted(title, run, rowList))
                .exchange();
        response.expectStatus().isCreated();
        return body(response);
    }

    private RestTestClient.ResponseSpec patch(String id, String mediaType,
            String patch) {
        return client.patch().uri("/board/{id}", id).contentType(MediaType.parseMediaType(mediaType)).body(patch)
                .exchange();
    }

    private List<String> titles(String uri) {
        return titlesOf(body(client.get().uri(uri).exchange()));
    }

    private static List<String> titlesOf(JsonNode boards) {
        return boards.values().stream().map(board -> board.get("title").asString()).toList();
    }

    static JsonNode body(RestTestClient.ResponseSpec response) {
        return JSON.readTree(response.expectBody(String.class).returnResult().getResponseBody());
    }
}
