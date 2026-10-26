package com.addf.backend.armature.problem;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.addf.backend.armature.help.HelpPage;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

/**
 * Keeps the problem catalog honest (plan, "Enforcement"): every {@link ProblemType} has a help page
 * in {@code docs/help/problems/} whose front matter matches it and which has the four required
 * sections; every page there has a type; and every type is produced by a test marked
 * {@link ProducesProblem}.
 */
class ProblemCatalogTest {

    private static final Path PROBLEMS = Path.of("../docs/help/problems");
    private static final String[] REQUIRED_SECTIONS = {
            "## What happened", "## Why", "## What you can do", "## For the assistant" };

    @Test
    void everyProblemTypeHasAMatchingHelpPage() throws IOException {
        for (ProblemType type : ProblemType.values()) {
            Path file = PROBLEMS.resolve(type.slug() + ".md");
            assertThat(file).as("help page for %s", type).exists();
            HelpPage page = HelpPage.parse("problems", type.slug(), Files.readString(file));

            assertThat(page.frontMatter())
                    .as("front matter of %s", file)
                    .containsEntry("type", type.typeUri())
                    .containsEntry("title", type.title())
                    .containsEntry("status", String.valueOf(type.status()))
                    .containsEntry("code", type.code());
            for (String section : REQUIRED_SECTIONS) {
                assertThat(page.body()).as("%s in %s", section, file).contains("\n" + section + "\n");
            }
        }
    }

    @Test
    void everyHelpPageHasAProblemType() throws IOException {
        Set<String> slugs = Arrays.stream(ProblemType.values()).map(ProblemType::slug).collect(Collectors.toSet());
        try (Stream<Path> pages = Files.list(PROBLEMS)) {
            for (Path page : pages.filter(p -> p.toString().endsWith(".md")).toList()) {
                String slug = page.getFileName().toString().replaceFirst("\\.md$", "");
                assertThat(slugs).as("ProblemType for docs/help/problems/%s", page.getFileName()).contains(slug);
            }
        }
    }

    @Test
    void everyProblemTypeIsProducedByATest() {
        Set<String> produced = new ClassFileImporter()
                .withImportOption(new ImportOption.OnlyIncludeTests())
                .importPackages("com.addf.backend.armature")
                .stream()
                .flatMap(type -> type.getMethods().stream())
                .filter(method -> method.isAnnotatedWith(ProducesProblem.class))
                .map(method -> method.getAnnotationOfType(ProducesProblem.class).value())
                .collect(Collectors.toSet());

        for (ProblemType type : ProblemType.values()) {
            assertThat(produced).as("a @ProducesProblem(\"%s\") test", type.slug()).contains(type.slug());
        }
    }
}
