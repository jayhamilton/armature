package com.addf.backend.armature.tmf;

import java.util.stream.Stream;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import tools.jackson.databind.JsonNode;

/**
 * A rule a resource either satisfies or not, parsed from a TMF 630 filter such as
 * {@code state=DRAFT} or {@code lastUpdate.gt=2026-10-01}.
 *
 * <h2>Pattern</h2>
 * Interpreter and Specification. Each filter in a query string is a sentence in a tiny language;
 * {@link FilterParser} turns it into an expression tree whose nodes are specifications:
 * {@link AnyOf} and {@link Compare} are terminal expressions, {@link AllOf} combines them.
 * Evaluating the tree against a resource interprets the query.
 *
 * <h2>Principle</h2>
 * Single responsibility: parsing a query, deciding whether a resource matches, and fetching
 * resources are three separate jobs. Specifications only decide.
 *
 * <h2>Why here</h2>
 * Every TMF 630 resource (boards now; capabilities, data sources, and pinned answers later)
 * accepts the same filters. Specifications evaluate any resource's JSON tree, so no resource
 * writes its own filtering code. In INC-01b a specification can also be translated to SQL.
 *
 * <h2>How to extend</h2>
 * A new operator is a constant in {@link Compare.Operator}; a new kind of rule is a new record
 * implementing this interface, added to {@code permits} and produced by {@link FilterParser}.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/interpreter-specification.md}, {@code docs/api/tmf630-conformance.md}.
 */
@DesignPattern(pattern = Pattern.INTERPRETER_SPECIFICATION, role = "AbstractExpression",
        doc = "docs/patterns/interpreter-specification.md")
@SolidPrinciple(value = Principle.SINGLE_RESPONSIBILITY, note = "Decides whether a resource matches; nothing else.")
public sealed interface Specification permits AllOf, AnyOf, Compare {

    /** Whether the resource's JSON representation satisfies this rule. */
    boolean isSatisfiedBy(JsonNode resource);

    /** The attribute paths this rule reads, for example {@code board.id}. */
    Stream<String> paths();
}
