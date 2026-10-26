package com.addf.backend.armature.tmf;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.ProblemException;
import com.addf.backend.armature.problem.ProblemType;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

/**
 * Finds the {@link PatchStrategy} for a request's media type and applies it to a resource's
 * representation, then refuses the result if it changed anything the client may not change.
 *
 * <p>Resources patch their full representation (what a client just read), so a patch can name any
 * attribute it sees. Attributes outside {@code editable} (identity, state, version, timestamps,
 * nested resources with their own URI) must come out unchanged, or the patch is an
 * {@code invalid-patch} problem listing each one.
 */
@Component
@DesignPattern(pattern = Pattern.STRATEGY_REGISTRY, role = "Registry", doc = "docs/patterns/strategy-registry.md")
public class PatchStrategies {

    private final Map<String, PatchStrategy> byMediaType;

    public PatchStrategies(List<PatchStrategy> strategies) {
        this.byMediaType = strategies.stream().collect(Collectors.toMap(PatchStrategy::mediaType, Function.identity()));
    }

    /**
     * @param contentType the request's {@code Content-Type}
     * @param representation the resource as a client reads it
     * @param editable the top level attributes a patch may change
     * @return the patched representation
     */
    public JsonNode apply(MediaType contentType, JsonNode representation, JsonNode patch, Set<String> editable) {
        PatchStrategy strategy = byMediaType.get(contentType.getType() + "/" + contentType.getSubtype());
        if (strategy == null) {
            throw new ProblemException(ProblemType.UNSUPPORTED_MEDIA_TYPE, "PATCH accepts "
                    + String.join(" or ", byMediaType.keySet().stream().sorted().toList()) + ".");
        }
        JsonNode patched = strategy.apply(representation, patch);
        if (!patched.isObject()) {
            throw new InvalidPatchException("", "the patched resource must still be a JSON object.");
        }
        requireOnlyEditableChanged(representation, patched, editable);
        return patched;
    }

    private static void requireOnlyEditableChanged(JsonNode before, JsonNode after, Set<String> editable) {
        Set<String> names = new LinkedHashSet<>(before.propertyNames());
        names.addAll(after.propertyNames());
        List<FieldProblem> problems = new ArrayList<>();
        for (String name : names) {
            if (!editable.contains(name) && !Objects.equals(before.get(name), after.get(name))) {
                problems.add(new FieldProblem("/" + name, "'" + name + "' cannot be changed with PATCH."));
            }
        }
        if (!problems.isEmpty()) {
            throw new InvalidPatchException(problems);
        }
    }
}
