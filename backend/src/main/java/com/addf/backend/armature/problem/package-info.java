/**
 * RFC 9457 problem details (ADR-0019): the one way any module reports an error. Domain exceptions
 * extend {@link com.addf.backend.armature.problem.ProblemException} and name their
 * {@link com.addf.backend.armature.problem.ProblemType}; every type has a help page in
 * {@code docs/help/problems/}. An open module, so every other module may raise problems.
 */
@ApplicationModule(displayName = "Problem", type = ApplicationModule.Type.OPEN, allowedDependencies = "patterns")
package com.addf.backend.armature.problem;

import org.springframework.modulith.ApplicationModule;
