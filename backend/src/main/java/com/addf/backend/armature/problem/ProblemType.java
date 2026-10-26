package com.addf.backend.armature.problem;

/**
 * The catalog of problem types the API can return. Each entry has a help page at
 * {@code docs/help/problems/<slug>.md} whose front matter repeats the title, status, and code;
 * {@code ProblemCatalogTest} fails if the two disagree or either is missing.
 *
 * <p>{@code title} never varies per occurrence (RFC 9457, section 3.1.3); the occurrence's own
 * explanation goes in {@code detail}. {@code code} is stable, for logs and support.
 *
 * <p>Add an entry with the {@code armature-add-problem-type} skill, which also writes the help page
 * and a test that produces the problem.
 */
public enum ProblemType {

    RESOURCE_NOT_FOUND("resource-not-found", "The resource does not exist", 404, "ARM-RES-404-NOT-FOUND"),
    INVALID_QUERY("invalid-query", "The query cannot be applied", 400, "ARM-QUERY-400-INVALID"),
    INVALID_REQUEST("invalid-request", "The request is not valid", 400, "ARM-REQ-400-INVALID"),
    INVALID_PATCH("invalid-patch", "The patch cannot be applied", 422, "ARM-PATCH-422-INVALID"),
    METHOD_NOT_ALLOWED("method-not-allowed", "This method is not allowed here", 405, "ARM-METHOD-405-NOT-ALLOWED"),
    NOT_ACCEPTABLE("not-acceptable", "No acceptable representation", 406, "ARM-MEDIA-406-NOT-ACCEPTABLE"),
    UNSUPPORTED_MEDIA_TYPE("unsupported-media-type", "The media type is not supported", 415,
            "ARM-MEDIA-415-UNSUPPORTED"),
    TRANSITION_NOT_ALLOWED("transition-not-allowed", "This change is not allowed in the current state", 409,
            "ARM-LIFECYCLE-409-NOT-ALLOWED"),
    INTERNAL_ERROR("internal-error", "Something went wrong on our side", 500, "ARM-500-INTERNAL");

    /** Where problem types are identified, whoever runs Armature (plan, "Problem type URIs"). */
    public static final String TYPE_BASE = "https://jayhamilton.github.io/armature/problems/";

    /** Where this deployment serves its own copy of each help page. */
    public static final String HELP_BASE = "/help/problems/";

    private final String slug;
    private final String title;
    private final int status;
    private final String code;

    ProblemType(String slug, String title, int status, String code) {
        this.slug = slug;
        this.title = title;
        this.status = status;
        this.code = code;
    }

    public String slug() {
        return slug;
    }

    public String title() {
        return title;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }

    /** The permanent identifier, for example {@code https://jayhamilton.github.io/armature/problems/invalid-query}. */
    public String typeUri() {
        return TYPE_BASE + slug;
    }

    /** This deployment's help page, for example {@code /help/problems/invalid-query}. */
    public String helpHref() {
        return HELP_BASE + slug;
    }
}
