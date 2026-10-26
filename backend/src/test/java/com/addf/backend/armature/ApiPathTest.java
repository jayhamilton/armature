package com.addf.backend.armature;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.AnnotatedElement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import org.junit.jupiter.api.Test;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * No resource path carries a version (ADR-0020). A URI names a resource, not a release of the
 * server; the API evolves additively and through links and media types, so an {@code href} a
 * client stored stays valid. This test reads every request mapping in the backend and fails on a
 * segment such as {@code /v1} or {@code /v2}.
 */
class ApiPathTest {

    private static final Pattern VERSION_SEGMENT = Pattern.compile("(^|/)v\\d+(\\.\\d+)*(/|$)", Pattern.CASE_INSENSITIVE);

    @Test
    void noRequestMappingHasAVersionInItsPath() {
        List<String> versioned = new ArrayList<>();
        List<Class<?>> controllers = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.addf.backend.armature")
                .stream()
                .filter(type -> type.isMetaAnnotatedWith(Controller.class))
                .<Class<?>>map(type -> type.reflect())
                .toList();
        assertThat(controllers).as("controllers found").isNotEmpty();

        for (Class<?> controller : controllers) {
            for (String classPath : paths(controller)) {
                for (var method : controller.getDeclaredMethods()) {
                    for (String methodPath : paths(method)) {
                        String path = classPath + methodPath;
                        if (VERSION_SEGMENT.matcher(path).find()) {
                            versioned.add(controller.getSimpleName() + "." + method.getName() + " -> " + path);
                        }
                    }
                }
            }
        }
        assertThat(versioned)
                .as("paths with a version segment; evolve the resource instead (ADR-0020)")
                .isEmpty();
    }

    @Test
    void theVersionPatternCatchesTheUsualForms() {
        assertThat(Stream.of("/v1/board", "/api/v2", "/tmf-api/boardManagement/v4/board", "/V3", "/v1.2/x"))
                .allMatch(path -> VERSION_SEGMENT.matcher(path).find());
        assertThat(Stream.of("/board", "/gadgetInstance/{id}", "/help/{section}/{slug}", "/api/agent/chat", "/video"))
                .noneMatch(path -> VERSION_SEGMENT.matcher(path).find());
    }

    private static List<String> paths(AnnotatedElement element) {
        RequestMapping mapping = AnnotatedElementUtils.findMergedAnnotation(element, RequestMapping.class);
        if (mapping == null) {
            return element instanceof Class<?> ? List.of("") : List.of();
        }
        String[] paths = mapping.path().length > 0 ? mapping.path() : mapping.value();
        return paths.length == 0 ? List.of("") : Arrays.asList(paths);
    }
}
