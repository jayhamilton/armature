package com.addf.backend.armature.tmf;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * JSON Merge Patch (RFC 7386): the patch looks like the resource, a member set to {@code null} is
 * removed, and any other member replaces or (for objects) merges into the one it names. The whole
 * algorithm is the RFC's own ten line pseudocode, below.
 */
@Component
@DesignPattern(pattern = Pattern.STRATEGY_REGISTRY, role = "ConcreteStrategy",
        doc = "docs/patterns/strategy-registry.md")
public class MergePatch implements PatchStrategy {

    @Override
    public String mediaType() {
        return MERGE_PATCH_JSON;
    }

    @Override
    public JsonNode apply(JsonNode target, JsonNode patch) {
        if (!patch.isObject()) {
            throw new InvalidPatchException("", "a merge patch must be a JSON object.");
        }
        return merge(target.deepCopy(), patch);
    }

    private static JsonNode merge(JsonNode target, JsonNode patch) {
        if (!patch.isObject()) {
            return patch;
        }
        ObjectNode result = target != null && target.isObject()
                ? (ObjectNode) target
                : ((ObjectNode) patch).objectNode();
        patch.properties().forEach(member -> {
            if (member.getValue().isNull()) {
                result.remove(member.getKey());
            } else {
                result.set(member.getKey(), merge(result.get(member.getKey()), member.getValue()));
            }
        });
        return result;
    }
}
