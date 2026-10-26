package com.addf.backend.armature.help;

import java.util.Optional;

import org.jmolecules.architecture.hexagonal.Port;

/**
 * Where help pages come from. Today: the repository's own {@code docs/help}. From INC-06 also the
 * help each capability contributes in its manifest, which is why this is a port.
 */
@Port
public interface HelpCatalog {

    Optional<HelpPage> page(String section, String slug);
}
