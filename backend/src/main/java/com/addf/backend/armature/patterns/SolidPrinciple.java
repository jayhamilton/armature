package com.addf.backend.armature.patterns;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a type as embodying a SOLID decision, with a one line note on where exactly.
 * Listed alongside {@link DesignPattern} in the generated pattern catalog.
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface SolidPrinciple {

    /** The principle this type demonstrates. */
    Principle value();

    /** Where and how, in one sentence (for example "A new board state is a new class"). */
    String note();
}
