package com.addf.backend.armature.problem;

import java.util.HexFormat;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import jakarta.servlet.http.HttpServletRequest;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Turns every exception that leaves a controller into an RFC 9457 problem
 * ({@code application/problem+json}) built by {@link ProblemBuilder}.
 *
 * <ul>
 * <li>A {@link ProblemException} already names its type.</li>
 * <li>An error Spring MVC raises itself (unsupported media type, unreadable body, no such path)
 * is looked up in {@link #FRAMEWORK_TYPES} by exception class, walking up the class hierarchy,
 * so it gets an Armature type and help page too.</li>
 * <li>Anything else is {@code internal-error}, logged here; its message never reaches the client.</li>
 * </ul>
 */
@PrimaryAdapter
@RestControllerAdvice
public class ProblemAdvice extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ProblemAdvice.class);

    static final Map<Class<? extends Exception>, ProblemType> FRAMEWORK_TYPES = Map.of(
            NoResourceFoundException.class, ProblemType.RESOURCE_NOT_FOUND,
            HttpMessageNotReadableException.class, ProblemType.INVALID_REQUEST,
            MethodArgumentTypeMismatchException.class, ProblemType.INVALID_REQUEST,
            MissingServletRequestParameterException.class, ProblemType.INVALID_REQUEST,
            HttpRequestMethodNotSupportedException.class, ProblemType.METHOD_NOT_ALLOWED,
            HttpMediaTypeNotAcceptableException.class, ProblemType.NOT_ACCEPTABLE,
            HttpMediaTypeNotSupportedException.class, ProblemType.UNSUPPORTED_MEDIA_TYPE);

    @ExceptionHandler(ProblemException.class)
    ResponseEntity<Object> handleProblem(ProblemException exception, HttpServletRequest request) {
        ProblemDetail problem = start(exception.type(), request)
                .detail(exception.detail())
                .errors(exception.errors())
                .build();
        return respond(problem, new HttpHeaders());
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> handleUnexpected(Exception exception, HttpServletRequest request) {
        ProblemDetail problem = start(ProblemType.INTERNAL_ERROR, request)
                .detail("The request could not be completed. Quote the trace id if you report this.")
                .build();
        log.error("Unexpected error, traceId {}", problem.getProperties().get("traceId"), exception);
        return respond(problem, new HttpHeaders());
    }

    /** Every error Spring MVC handles itself passes through here; replace its body with ours. */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        HttpServletRequest servletRequest = ((ServletWebRequest) request).getRequest();
        String detail = exception instanceof ErrorResponse errorResponse
                ? errorResponse.getBody().getDetail()
                : null;
        ProblemDetail problem = start(frameworkType(exception.getClass(), status), servletRequest)
                .status(status.value())
                .detail(detail)
                .build();
        return respond(problem, headers);
    }

    static ProblemType frameworkType(Class<?> exceptionClass, HttpStatusCode status) {
        for (Class<?> type = exceptionClass; type != null; type = type.getSuperclass()) {
            ProblemType mapped = FRAMEWORK_TYPES.get(type);
            if (mapped != null) {
                return mapped;
            }
        }
        return status.is4xxClientError() ? ProblemType.INVALID_REQUEST : ProblemType.INTERNAL_ERROR;
    }

    private static ProblemBuilder start(ProblemType type, HttpServletRequest request) {
        return ProblemBuilder.of(type)
                .instance(request.getRequestURI())
                .traceId(traceId(request.getHeader("traceparent")));
    }

    /**
     * The W3C {@code traceparent} trace id when the caller sent one, so the problem joins the
     * caller's trace; otherwise a fresh id to quote in a support request.
     */
    static String traceId(String traceparent) {
        if (traceparent != null) {
            String[] parts = traceparent.split("-");
            if (parts.length == 4 && parts[1].length() == 32) {
                return parts[1];
            }
        }
        byte[] random = new byte[8];
        ThreadLocalRandom.current().nextBytes(random);
        return HexFormat.of().formatHex(random);
    }

    private static ResponseEntity<Object> respond(ProblemDetail problem, HttpHeaders headers) {
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.putAll(headers);
        responseHeaders.setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        return ResponseEntity.status(problem.getStatus()).headers(responseHeaders).body(problem);
    }
}
