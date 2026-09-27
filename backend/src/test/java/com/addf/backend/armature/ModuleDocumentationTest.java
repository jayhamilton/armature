package com.addf.backend.armature;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

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

    private static final Path OUTPUT = Path.of("../docs/architecture/modules");

    @Test
    void writeModuleDocumentation() throws IOException {
        DiagramOptions diagrams = DiagramOptions.defaults()
                .withStyle(DiagramStyle.C4)
                // Show modules with no dependencies too (config, datasource), so the view is complete.
                .withElementsWithoutRelationships(DiagramOptions.ElementsWithoutRelationships.VISIBLE);

        // withoutClean: the folder also holds a hand written README and the rendered SVGs.
        new Documenter(ModularityTest.MODULES, Options.defaults().withOutputFolder(OUTPUT.toString()).withoutClean())
                .writeModulesAsPlantUml(diagrams)
                .writeIndividualModulesAsPlantUml(diagrams)
                .writeModuleCanvases();

        try (Stream<Path> files = Files.list(OUTPUT)) {
            for (Path puml : files.filter(file -> file.toString().endsWith(".puml")).toList()) {
                sortRelationships(puml);
            }
        }
    }

    /**
     * The Documenter emits relationships in no fixed order, which would change the committed files
     * (and so the SVGs) on every run. Sorting each block of {@code Rel(...)} lines makes the output
     * depend only on the module structure.
     */
    private static void sortRelationships(Path puml) throws IOException {
        List<String> lines = new ArrayList<>(Files.readAllLines(puml));
        int start = 0;
        while (start < lines.size()) {
            int end = start;
            while (end < lines.size() && lines.get(end).startsWith("Rel(")) {
                end++;
            }
            if (end > start) {
                lines.subList(start, end).sort(null);
                start = end;
            } else {
                start++;
            }
        }
        Files.writeString(puml, String.join("\n", lines) + "\n");
    }
}
