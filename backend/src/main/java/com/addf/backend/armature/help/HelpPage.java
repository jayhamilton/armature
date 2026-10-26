package com.addf.backend.armature.help;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One help page: its front matter (for a problem page, {@code type}, {@code title}, {@code status},
 * {@code code}) and its markdown body.
 *
 * @param section the catalog section, for example {@code problems} or {@code gadgets}
 * @param slug the page name within the section, for example {@code invalid-query}
 * @param markdown the whole file, front matter included, as written
 */
public record HelpPage(String section, String slug, Map<String, String> frontMatter, String body, String markdown) {

    private static final String FENCE = "---";

    /** Reads a page; a page with no front matter has an empty one. */
    public static HelpPage parse(String section, String slug, String markdown) {
        String text = markdown.replace("\r\n", "\n");
        Map<String, String> frontMatter = new LinkedHashMap<>();
        if (!text.startsWith(FENCE + "\n")) {
            return new HelpPage(section, slug, frontMatter, text, markdown);
        }
        int end = text.indexOf("\n" + FENCE + "\n", FENCE.length());
        if (end < 0) {
            return new HelpPage(section, slug, frontMatter, text, markdown);
        }
        for (String line : text.substring(FENCE.length() + 1, end).split("\n")) {
            int colon = line.indexOf(':');
            if (colon > 0) {
                frontMatter.put(line.substring(0, colon).trim(), unquote(line.substring(colon + 1).trim()));
            }
        }
        return new HelpPage(section, slug, frontMatter, text.substring(end + FENCE.length() + 2), markdown);
    }

    private static String unquote(String value) {
        return value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")
                ? value.substring(1, value.length() - 1)
                : value;
    }
}
