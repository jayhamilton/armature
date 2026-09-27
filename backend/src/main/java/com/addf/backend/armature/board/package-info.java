/**
 * Boards: for now, the board lifecycle as the State pattern reference (ADR-0006). Board resources
 * arrive in INC-01.
 */
@ApplicationModule(displayName = "Board", allowedDependencies = { "lifecycle", "patterns" })
package com.addf.backend.armature.board;

import org.springframework.modulith.ApplicationModule;
