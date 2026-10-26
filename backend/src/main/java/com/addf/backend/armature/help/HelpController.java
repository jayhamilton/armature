package com.addf.backend.armature.help;

import java.util.List;
import java.util.Map;

import com.addf.backend.armature.problem.ResourceNotFoundException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MimeTypeUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code /help/<section>/<slug>}: one help page. Markdown by default, for people and for agents;
 * JSON (front matter and body apart) when the client asks for {@code application/json}. HTML for
 * people comes from the user guide site (INC-01d).
 */
@PrimaryAdapter
@RestController
@CrossOrigin
@Tag(name = "Help", description = "The help catalog: problem types, gadgets, tasks, concepts")
public class HelpController {

    static final MediaType MARKDOWN = MediaType.parseMediaType("text/markdown;charset=UTF-8");
    private static final List<MediaType> OFFERED = List.of(MARKDOWN, MediaType.APPLICATION_JSON);

    private final HelpCatalog catalog;

    public HelpController(HelpCatalog catalog) {
        this.catalog = catalog;
    }

    @Operation(summary = "Read a help page", description = "text/markdown by default, or application/json.")
    @GetMapping(path = "/help/{section}/{slug}", produces = { "text/markdown", MediaType.APPLICATION_JSON_VALUE })
    public ResponseEntity<Object> page(@PathVariable String section, @PathVariable String slug,
            HttpServletRequest request) {
        HelpPage page = catalog.page(section, slug)
                .orElseThrow(() -> new ResourceNotFoundException("help page", section + "/" + slug));
        if (preferred(request.getHeader("Accept")).equals(MediaType.APPLICATION_JSON)) {
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(Map.of(
                    "section", page.section(), "slug", page.slug(),
                    "frontMatter", page.frontMatter(), "body", page.body()));
        }
        return ResponseEntity.ok().contentType(MARKDOWN).body(page.markdown());
    }

    /** The offered type the client prefers most, markdown when it does not say. */
    private static MediaType preferred(String accept) {
        if (accept == null || accept.isBlank()) {
            return MARKDOWN;
        }
        List<MediaType> wanted = MediaType.parseMediaTypes(accept);
        MimeTypeUtils.sortBySpecificity(wanted);
        for (MediaType type : wanted) {
            for (MediaType offered : OFFERED) {
                if (type.isCompatibleWith(offered)) {
                    return offered;
                }
            }
        }
        return MARKDOWN;
    }
}
