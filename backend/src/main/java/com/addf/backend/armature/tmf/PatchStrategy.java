package com.addf.backend.armature.tmf;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import tools.jackson.databind.JsonNode;

/**
 * One way of applying a {@code PATCH} body to a resource, chosen by the request's media type.
 *
 * <h2>Pattern</h2>
 * Strategy with registry: each implementation handles one media type, and {@link PatchStrategies}
 * finds it by that media type.
 *
 * <h2>Principle</h2>
 * Open/Closed: TMF 630 names two patch formats today; a third is a new class, with no change to
 * the registry or to any controller.
 *
 * <h2>Why here</h2>
 * Every TMF 630 resource accepts both {@code application/merge-patch+json} (RFC 7386) and
 * {@code application/json-patch+json} (RFC 6902). No patch library passes the dependency policy,
 * and both RFCs are short enough to read alongside the code.
 *
 * <h2>How to extend</h2>
 * Implement this interface as a Spring component; it registers itself by {@link #mediaType()}.
 * Add the media type to the controllers' {@code consumes}.
 *
 * <h2>See also</h2>
 * {@code docs/patterns/strategy-registry.md}, {@link MergePatch}, {@link JsonPatch}.
 */
@DesignPattern(pattern = Pattern.STRATEGY_REGISTRY, role = "Strategy", doc = "docs/patterns/strategy-registry.md")
@SolidPrinciple(value = Principle.OPEN_CLOSED, note = "A new patch format is a new class.")
public interface PatchStrategy {

    String MERGE_PATCH_JSON = "application/merge-patch+json";
    String JSON_PATCH_JSON = "application/json-patch+json";

    /** The media type this strategy applies, for example {@code application/merge-patch+json}. */
    String mediaType();

    /**
     * Applies a patch to a copy of {@code target}; {@code target} itself is never changed.
     *
     * @throws InvalidPatchException if the patch is malformed or cannot be applied
     */
    JsonNode apply(JsonNode target, JsonNode patch);
}
