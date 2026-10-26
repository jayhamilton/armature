/**
 * TMF 630 conventions, written in house (ADR-0007): query parameters ({@code fields}, filters,
 * {@code sort}, {@code offset}, {@code limit}) applied to any resource's JSON representation, and
 * both PATCH media types in {@code tmf.patch}. Resource modules use it; it knows no resource.
 */
@ApplicationModule(displayName = "TMF 630", allowedDependencies = { "patterns", "problem" })
package com.addf.backend.armature.tmf;

import org.springframework.modulith.ApplicationModule;
