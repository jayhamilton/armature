package com.addf.backend.armature.problem;

import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.client.RestTestClient;

/** Checks that a response is the RFC 9457 problem Armature promises for a given type. */
public final class ProblemAssertions {

    private ProblemAssertions() {
    }

    public static RestTestClient.BodyContentSpec expectProblem(RestTestClient.ResponseSpec response, ProblemType type) {
        response.expectStatus().isEqualTo(type.status());
        response.expectHeader().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        return response.expectBody()
                .jsonPath("$.type").isEqualTo(type.typeUri())
                .jsonPath("$.title").isEqualTo(type.title())
                .jsonPath("$.status").isEqualTo(type.status())
                .jsonPath("$.code").isEqualTo(type.code())
                .jsonPath("$.traceId").isNotEmpty()
                .jsonPath("$.errors").isArray()
                .jsonPath("$._links.help.href").isEqualTo(type.helpHref());
    }
}
