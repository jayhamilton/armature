/**
 * The {@code LifecycleEngine} port shared by every resource lifecycle (ADR-0006).
 */
@ApplicationModule(displayName = "Lifecycle", allowedDependencies = { "patterns", "problem" })
package com.addf.backend.armature.lifecycle;

import org.springframework.modulith.ApplicationModule;
