package com.addf.backend.armature.help;

import static com.addf.backend.armature.problem.ProblemAssertions.expectProblem;
import static org.assertj.core.api.Assertions.assertThat;

import com.addf.backend.armature.ApiTest;
import com.addf.backend.armature.problem.ProblemType;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

/** {@code /help}: every problem's {@code _links.help} resolves, as markdown or JSON. */
class HelpApiTest extends ApiTest {

    @Test
    void everyProblemTypesHelpLinkResolves() {
        for (ProblemType type : ProblemType.values()) {
            client.get().uri(type.helpHref()).exchange()
                    .expectStatus().isOk()
                    .expectHeader().contentTypeCompatibleWith(MediaType.parseMediaType("text/markdown"));
        }
    }

    @Test
    void markdownIsTheDefaultAndJsonSplitsFrontMatterFromBody() {
        String markdown = client.get().uri("/help/problems/invalid-query").exchange()
                .expectBody(String.class).returnResult().getResponseBody();
        assertThat(markdown).startsWith("---\ntype: " + ProblemType.INVALID_QUERY.typeUri());

        client.get().uri("/help/problems/invalid-query").accept(MediaType.APPLICATION_JSON).exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.frontMatter.code").isEqualTo(ProblemType.INVALID_QUERY.code())
                .jsonPath("$.body").value(body -> assertThat(body.toString()).contains("## What happened"));
    }

    @Test
    void gadgetHelpIsServedToo() {
        client.get().uri("/help/gadgets/bar-chart").exchange().expectStatus().isOk();
    }

    @Test
    void anUnknownOrMalformedSlugIsResourceNotFound() {
        expectProblem(client.get().uri("/help/problems/no-such-problem").exchange(), ProblemType.RESOURCE_NOT_FOUND);
        expectProblem(client.get().uri("/help/secrets/bar-chart").exchange(), ProblemType.RESOURCE_NOT_FOUND);
        expectProblem(client.get().uri("/help/gadgets/..%2Fproblems%2Finvalid-query").exchange(),
                ProblemType.RESOURCE_NOT_FOUND);
    }
}
