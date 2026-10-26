package com.addf.backend.armature.tmf;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Both PATCH formats, checked against examples from their RFCs, and the read only guard. */
class PatchTest {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final MergePatch merge = new MergePatch();
    private final JsonPatch jsonPatch = new JsonPatch();
    private final PatchStrategies strategies = new PatchStrategies(List.of(merge, jsonPatch));

    @Test
    void mergePatchFollowsRfc7386() {
        // RFC 7386, section 3.
        JsonNode target = json("""
                {"title": "Goodbye!", "author": {"givenName": "John", "familyName": "Doe"},
                 "tags": ["example", "sample"], "content": "This will be unchanged"}""");
        JsonNode patch = json("""
                {"title": "Hello!", "phoneNumber": "+01-123-456-7890", "author": {"familyName": null},
                 "tags": ["example"]}""");
        assertThat(merge.apply(target, patch)).isEqualTo(json("""
                {"title": "Hello!", "author": {"givenName": "John"}, "tags": ["example"],
                 "content": "This will be unchanged", "phoneNumber": "+01-123-456-7890"}"""));
        assertThat(target.get("title").asString()).as("the target is not changed").isEqualTo("Goodbye!");
    }

    @Test
    void jsonPatchFollowsRfc6902() {
        JsonNode result = jsonPatch.apply(json("{\"foo\": [\"bar\", \"baz\"], \"a\": {\"b\": 1}}"), json("""
                [{"op": "add", "path": "/foo/1", "value": "qux"},
                 {"op": "remove", "path": "/foo/2"},
                 {"op": "replace", "path": "/a/b", "value": 2},
                 {"op": "copy", "from": "/a", "path": "/c"},
                 {"op": "move", "from": "/a", "path": "/d"},
                 {"op": "add", "path": "/foo/-", "value": "end"},
                 {"op": "add", "path": "/~1escaped", "value": true},
                 {"op": "test", "path": "/d/b", "value": 2}]"""));
        assertThat(result).isEqualTo(json("""
                {"foo": ["bar", "qux", "end"], "c": {"b": 2}, "d": {"b": 2}, "/escaped": true}"""));
    }

    @Test
    void jsonPatchErrorsPointAtTheFailingOperation() {
        JsonNode target = json("{\"a\": 1}");
        assertThatThrownBy(() -> jsonPatch.apply(target, json("[{\"op\": \"remove\", \"path\": \"/b\"}]")))
                .isInstanceOfSatisfying(InvalidPatchException.class,
                        problem -> assertThat(problem.errors().getFirst().pointer()).isEqualTo("/0/path"));
        assertThatThrownBy(() -> jsonPatch.apply(target, json("[{\"op\": \"jump\", \"path\": \"/a\"}]")))
                .isInstanceOfSatisfying(InvalidPatchException.class,
                        problem -> assertThat(problem.errors().getFirst().pointer()).isEqualTo("/0/op"));
        assertThatThrownBy(() -> jsonPatch.apply(target, json("[{\"op\": \"move\", \"from\": \"/x\", \"path\": \"/a\"}]")))
                .isInstanceOfSatisfying(InvalidPatchException.class,
                        problem -> assertThat(problem.errors().getFirst().pointer()).isEqualTo("/0/from"));
        assertThatThrownBy(() -> jsonPatch.apply(target, json("{\"op\": \"add\"}")))
                .isInstanceOf(InvalidPatchException.class);
    }

    @Test
    void attributesOutsideTheEditableSetMustNotChange() {
        JsonNode resource = json("{\"id\": \"7\", \"title\": \"Old\", \"state\": \"DRAFT\"}");
        MediaType mergeType = MediaType.parseMediaType(PatchStrategy.MERGE_PATCH_JSON);

        assertThat(strategies.apply(mergeType, resource, json("{\"title\": \"New\"}"), Set.of("title"))
                .get("title").asString()).isEqualTo("New");
        assertThatThrownBy(() -> strategies.apply(mergeType, resource, json("{\"state\": \"LOCKED\", \"id\": null}"),
                Set.of("title")))
                .isInstanceOfSatisfying(InvalidPatchException.class, problem -> assertThat(problem.errors())
                        .extracting(error -> error.pointer()).containsExactly("/id", "/state"));
    }

    private static JsonNode json(String text) {
        return JSON.readTree(text);
    }
}
