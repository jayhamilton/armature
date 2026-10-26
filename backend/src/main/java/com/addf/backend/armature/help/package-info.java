/**
 * The help catalog over HTTP: the pages in {@code docs/help}, which Maven copies onto the classpath,
 * served at {@code /help/<section>/<slug>} as markdown for people and agents, or as JSON. Every
 * problem's {@code _links.help} points here.
 */
@ApplicationModule(displayName = "Help", allowedDependencies = { "patterns", "problem" })
package com.addf.backend.armature.help;

import org.springframework.modulith.ApplicationModule;
