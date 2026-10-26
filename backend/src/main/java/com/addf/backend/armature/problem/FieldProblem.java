package com.addf.backend.armature.problem;

/**
 * One entry of a problem's {@code errors} member: what is wrong, and where, as a JSON Pointer into
 * the request body or the resource (the shape RFC 9457 itself uses for validation errors).
 *
 * @param pointer a JSON Pointer such as {@code /title} or {@code /rows/0/structure}
 * @param detail what is wrong at that pointer, for a person
 */
public record FieldProblem(String pointer, String detail) {
}
