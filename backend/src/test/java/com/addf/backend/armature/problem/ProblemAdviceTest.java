package com.addf.backend.armature.problem;

import static org.assertj.core.api.Assertions.assertThat;

import com.addf.backend.armature.lifecycle.TransitionNotAllowedException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.HttpMediaTypeNotSupportedException;

/**
 * {@link ProblemAdvice} on its own, for the problems no endpoint raises yet: lifecycle refusals
 * arrive as API calls in INC-02, and an internal error should never be reproducible on purpose.
 */
class ProblemAdviceTest {

    private final ProblemAdvice advice = new ProblemAdvice();
    private final MockHttpServletRequest request = new MockHttpServletRequest("POST", "/board/42/lock");

    @Test
    @ProducesProblem("transition-not-allowed")
    void aRefusedTransitionIsTransitionNotAllowed() {
        ResponseEntity<Object> response = advice.handleProblem(new TransitionNotAllowedException("DRAFT", "LOCK"), request);
        ProblemDetail problem = (ProblemDetail) response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(409);
        assertThat(response.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(problem.getType()).hasToString(ProblemType.TRANSITION_NOT_ALLOWED.typeUri());
        assertThat(problem.getDetail()).isEqualTo("Event LOCK is not allowed in state DRAFT");
        assertThat(problem.getInstance()).hasToString("/board/42/lock");
        assertThat(problem.getProperties()).containsEntry("code", ProblemType.TRANSITION_NOT_ALLOWED.code());
    }

    @Test
    @ProducesProblem("internal-error")
    void anUnexpectedExceptionNeverLeaksItsMessage() {
        ResponseEntity<Object> response = advice.handleUnexpected(new IllegalStateException("db password is hunter2"),
                request);
        ProblemDetail problem = (ProblemDetail) response.getBody();

        assertThat(response.getStatusCode().value()).isEqualTo(500);
        assertThat(problem.getType()).hasToString(ProblemType.INTERNAL_ERROR.typeUri());
        assertThat(problem.getDetail()).doesNotContain("hunter2");
        assertThat(problem.getProperties()).containsKey("traceId");
    }

    @Test
    void frameworkExceptionsAreLookedUpByClassThenByStatus() {
        assertThat(ProblemAdvice.frameworkType(HttpMediaTypeNotSupportedException.class, HttpStatus.UNSUPPORTED_MEDIA_TYPE))
                .isEqualTo(ProblemType.UNSUPPORTED_MEDIA_TYPE);
        assertThat(ProblemAdvice.frameworkType(Exception.class, HttpStatus.CONFLICT))
                .isEqualTo(ProblemType.INVALID_REQUEST);
        assertThat(ProblemAdvice.frameworkType(Exception.class, HttpStatus.SERVICE_UNAVAILABLE))
                .isEqualTo(ProblemType.INTERNAL_ERROR);
    }

    @Test
    void traceIdComesFromTraceparentOrIsGenerated() {
        assertThat(ProblemAdvice.traceId("00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01"))
                .isEqualTo("4bf92f3577b34da6a3ce929d0e0e4736");
        assertThat(ProblemAdvice.traceId("garbage")).hasSize(16);
        assertThat(ProblemAdvice.traceId(null)).matches("[0-9a-f]{16}");
    }
}
