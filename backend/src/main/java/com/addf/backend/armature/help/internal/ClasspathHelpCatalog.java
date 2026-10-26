package com.addf.backend.armature.help.internal;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import com.addf.backend.armature.help.HelpCatalog;
import com.addf.backend.armature.help.HelpPage;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Help pages from {@code classpath:help/}, where the build copies {@code docs/help}. Section and
 * slug are checked against a strict pattern first, so a request can never read outside the catalog.
 */
@SecondaryAdapter
@Component
public class ClasspathHelpCatalog implements HelpCatalog {

    static final Set<String> SECTIONS = Set.of("problems", "gadgets", "tasks", "concepts");
    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");

    @Override
    public Optional<HelpPage> page(String section, String slug) {
        if (!SECTIONS.contains(section) || !SLUG.matcher(slug).matches()) {
            return Optional.empty();
        }
        ClassPathResource resource = new ClassPathResource("help/" + section + "/" + slug + ".md");
        if (!resource.exists()) {
            return Optional.empty();
        }
        try (InputStream in = resource.getInputStream()) {
            return Optional.of(HelpPage.parse(section, slug, new String(in.readAllBytes(), StandardCharsets.UTF_8)));
        } catch (IOException unreadable) {
            throw new UncheckedIOException(unreadable);
        }
    }
}
