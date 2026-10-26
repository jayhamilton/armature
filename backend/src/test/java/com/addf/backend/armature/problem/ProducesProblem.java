package com.addf.backend.armature.problem;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a test that makes the API return a problem and checks it. {@code ProblemCatalogTest} fails
 * when some {@link ProblemType} has no test marked with its slug, so every problem a client can
 * see is one a test has seen (plan, "Enforcement").
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface ProducesProblem {

    /** The problem type's slug, for example {@code invalid-query}. */
    String value();
}
