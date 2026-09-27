package com.addf.backend.armature.patterns;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a type as a participant in a design pattern, so the code can be taught from directly.
 * {@code PatternCatalogTest} reads these markers and generates {@code docs/patterns/index.md};
 * it fails if {@link #doc()} names a page that does not exist.
 *
 * <p>Example: {@code @DesignPattern(pattern = Pattern.STATE, role = "ConcreteState",
 * doc = "docs/patterns/state.md")}.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface DesignPattern {

    /** The pattern this type takes part in. */
    Pattern pattern();

    /** The participant role this type plays, in the pattern's usual vocabulary (for example "ConcreteState"). */
    String role();

    /** Repository relative path of the pattern page, for example {@code docs/patterns/state.md}. */
    String doc();
}
