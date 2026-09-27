package com.addf.backend.armature;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.stream.Stream;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.SolidPrinciple;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;

/**
 * Keeps the pattern catalog honest (plan, "The generated catalog"). It reads every
 * {@link DesignPattern} in the backend and:
 * <ul>
 * <li>generates the Java section of {@code docs/patterns/index.md}, and fails if the committed
 * section differs (run with {@code -Dpatterns.write=true} to rewrite it);</li>
 * <li>fails if an annotation's {@code doc} names a page that does not exist;</li>
 * <li>fails if a pattern page links a Java source file that no longer exists.</li>
 * </ul>
 */
class PatternCatalogTest {

    private static final Path REPO = Path.of("..").toAbsolutePath().normalize();
    private static final Path PATTERNS = REPO.resolve("docs/patterns");
    private static final Path INDEX = PATTERNS.resolve("index.md");
    private static final String START = "<!-- java-catalog:start -->";
    private static final String END = "<!-- java-catalog:end -->";

    private record Entry(JavaClass type, DesignPattern pattern, SolidPrinciple principle) {

        String sourcePath() {
            return "backend/src/main/java/" + type.getName().replace('.', '/') + ".java";
        }
    }

    private final List<Entry> entries = new ClassFileImporter()
            .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
            .importPackages("com.addf.backend.armature")
            .stream()
            .filter(type -> type.isAnnotatedWith(DesignPattern.class))
            .map(type -> new Entry(type,
                    type.getAnnotationOfType(DesignPattern.class),
                    type.tryGetAnnotationOfType(SolidPrinciple.class).orElse(null)))
            .sorted(Comparator.comparing((Entry e) -> e.pattern().pattern().title())
                    .thenComparing(e -> e.pattern().role())
                    .thenComparing(e -> e.type().getSimpleName()))
            .toList();

    @Test
    void everyAnnotationPointsToAnExistingPage() {
        assertThat(entries).isNotEmpty();
        for (Entry entry : entries) {
            assertThat(REPO.resolve(entry.pattern().doc()))
                    .as("page named by @DesignPattern on %s", entry.type().getName())
                    .exists();
        }
    }

    @Test
    void everyJavaSourceLinkedFromAPatternPageExists() throws IOException {
        java.util.regex.Pattern javaLink = java.util.regex.Pattern.compile("\\]\\(([^)#]+\\.java)(#[^)]*)?\\)");
        try (Stream<Path> pages = Files.list(PATTERNS)) {
            for (Path page : pages.filter(p -> p.toString().endsWith(".md")).toList()) {
                Matcher links = javaLink.matcher(Files.readString(page));
                while (links.find()) {
                    assertThat(page.getParent().resolve(links.group(1)).normalize())
                            .as("Java source linked from %s", REPO.relativize(page))
                            .exists();
                }
            }
        }
    }

    @Test
    void committedCatalogMatchesTheAnnotations() throws IOException {
        String index = Files.readString(INDEX);
        int start = index.indexOf(START) + START.length();
        int end = index.indexOf(END);
        assertThat(start).as("%s marker in %s", START, INDEX).isGreaterThan(START.length() - 1);

        String generated = "\n" + catalog();
        if (Boolean.getBoolean("patterns.write")) {
            Files.writeString(INDEX, index.substring(0, start) + generated + index.substring(end));
            return;
        }
        assertThat(index.substring(start, end))
                .as("docs/patterns/index.md is out of date; regenerate it with "
                        + "./mvnw test -Dtest=PatternCatalogTest -Dpatterns.write=true")
                .isEqualTo(generated);
    }

    private String catalog() {
        List<String> lines = new ArrayList<>();
        lines.add("| Pattern | Role | Type | Principle |");
        lines.add("| --- | --- | --- | --- |");
        for (Entry entry : entries) {
            String principle = entry.principle() == null ? ""
                    : entry.principle().value().title() + ": " + entry.principle().note();
            lines.add("| %s | %s | [`%s`](../../%s) | %s |".formatted(
                    entry.pattern().pattern().title(),
                    entry.pattern().role(),
                    entry.type().getSimpleName(),
                    entry.sourcePath(),
                    principle));
        }
        return String.join("\n", lines) + "\n";
    }
}
