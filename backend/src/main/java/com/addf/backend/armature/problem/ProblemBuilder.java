package com.addf.backend.armature.problem;

import java.net.URI;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import org.springframework.http.ProblemDetail;

/**
 * Builds the one RFC 9457 problem shape Armature returns, from a {@link ProblemType}.
 *
 * <h2>Pattern</h2>
 * Builder: a problem has required parts (type, title, status, code, help link) and optional parts
 * (detail, instance, trace id, field errors). The builder fills the required parts from the type,
 * so a caller can only add to a correct problem, never forget part of one.
 *
 * <h2>Principle</h2>
 * Single responsibility: this is the only class that creates a {@link ProblemDetail}. An ArchUnit
 * rule in {@code ProblemArchitectureTest} enforces that, so no module invents its own error body.
 *
 * <h2>Why here</h2>
 * Every surface (REST now; AG-UI, MCP, and A2A later) carries the same problem, and the
 * {@code type} must always name a page in the help catalog. One builder keeps all of them alike.
 *
 * <h2>How to extend</h2>
 * A new member that every problem carries is a new step here. A new kind of problem is a
 * {@link ProblemType} entry, not a change to this class.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/builder.md}, {@code docs/adr/0019-rfc9457-problem-details.md},
 * {@link ProblemAdvice}.
 */
@DesignPattern(pattern = Pattern.BUILDER, role = "Builder", doc = "docs/patterns/builder.md")
@SolidPrinciple(value = Principle.SINGLE_RESPONSIBILITY, note = "The only place a problem body is made.")
public final class ProblemBuilder {

    private final ProblemType type;
    private int status;
    private String detail;
    private URI instance;
    private String traceId;
    private final List<FieldProblem> errors = new ArrayList<>();

    private ProblemBuilder(ProblemType type) {
        this.type = type;
        this.status = type.status();
    }

    public static ProblemBuilder of(ProblemType type) {
        return new ProblemBuilder(type);
    }

    /** Overrides the type's usual status; only for framework errors whose status Spring already chose. */
    public ProblemBuilder status(int status) {
        this.status = status;
        return this;
    }

    public ProblemBuilder detail(String detail) {
        this.detail = detail;
        return this;
    }

    public ProblemBuilder instance(String path) {
        this.instance = path == null ? null : URI.create(path);
        return this;
    }

    public ProblemBuilder traceId(String traceId) {
        this.traceId = traceId;
        return this;
    }

    public ProblemBuilder error(String pointer, String detail) {
        errors.add(new FieldProblem(pointer, detail));
        return this;
    }

    public ProblemBuilder errors(List<FieldProblem> errors) {
        this.errors.addAll(errors);
        return this;
    }

    public ProblemDetail build() {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(URI.create(type.typeUri()));
        problem.setTitle(type.title());
        problem.setDetail(detail);
        problem.setInstance(instance);
        problem.setProperty("code", type.code());
        if (traceId != null) {
            problem.setProperty("traceId", traceId);
        }
        problem.setProperty("errors", errors.stream()
                .map(error -> Map.of("pointer", error.pointer(), "detail", error.detail()))
                .toList());
        Map<String, Object> links = new LinkedHashMap<>();
        links.put("help", Map.of("href", type.helpHref()));
        problem.setProperty("_links", links);
        return problem;
    }
}
