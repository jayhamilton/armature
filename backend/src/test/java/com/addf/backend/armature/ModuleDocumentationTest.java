package com.addf.backend.armature;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.docs.Documenter;
import org.springframework.modulith.docs.Documenter.DiagramOptions;
import org.springframework.modulith.docs.Documenter.DiagramOptions.DiagramStyle;
import org.springframework.modulith.docs.Documenter.Options;

/**
 * Writes the module diagrams (C4-PlantUML) and module canvases to {@code docs/architecture/modules/},
 * so the documented structure is always the verified one. After this runs, render the SVGs with
 * {@code docs/architecture/render.sh}; the Docs workflow fails if they are stale (ADR-0013).
 */
class ModuleDocumentationTest {

    private static final String OUTPUT = "../docs/architecture/modules";

    @Test
    void writeModuleDocumentation() {
        DiagramOptions diagrams = DiagramOptions.defaults()
                .withStyle(DiagramStyle.C4)
                // Show modules with no dependencies too (config, datasource), so the view is complete.
                .withElementsWithoutRelationships(DiagramOptions.ElementsWithoutRelationships.VISIBLE);

        // withoutClean: the folder also holds a hand written README and the rendered SVGs.
        new Documenter(ModularityTest.MODULES, Options.defaults().withOutputFolder(OUTPUT).withoutClean())
                .writeModulesAsPlantUml(diagrams)
                .writeIndividualModulesAsPlantUml(diagrams)
                .writeModuleCanvases();
    }
}
