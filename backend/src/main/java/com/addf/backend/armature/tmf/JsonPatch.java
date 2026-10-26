package com.addf.backend.armature.tmf;

import java.util.Arrays;
import java.util.List;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * JSON Patch (RFC 6902): a list of operations ({@code add}, {@code remove}, {@code replace},
 * {@code move}, {@code copy}, {@code test}) applied in order, all or nothing. Paths are JSON
 * Pointers (RFC 6901). An error's pointer names the failing member in the patch document, for
 * example {@code /2/path}. In the private helpers, {@code at} is that pointer.
 */
@Component
@DesignPattern(pattern = Pattern.STRATEGY_REGISTRY, role = "ConcreteStrategy",
        doc = "docs/patterns/strategy-registry.md")
public class JsonPatch implements PatchStrategy {

    /** The six operations, each knowing how to apply itself; looked up by name, never by a switch. */
    enum Operation {
        ADD {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                return add(document, path(operation, at), value(operation, at), at + "/path");
            }
        },
        REMOVE {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                remove(document, path(operation, at), at + "/path");
                return document;
            }
        },
        REPLACE {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                String path = path(operation, at);
                get(document, path, at + "/path");
                if (path.isEmpty()) {
                    return value(operation, at);
                }
                remove(document, path, at + "/path");
                return add(document, path, value(operation, at), at + "/path");
            }
        },
        MOVE {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                String from = from(operation, at);
                String path = path(operation, at);
                if (path.startsWith(from + "/")) {
                    throw new InvalidPatchException(at + "/from", "a value cannot be moved into itself.");
                }
                JsonNode value = get(document, from, at + "/from");
                remove(document, from, at + "/from");
                return add(document, path, value, at + "/path");
            }
        },
        COPY {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                JsonNode value = get(document, from(operation, at), at + "/from").deepCopy();
                return add(document, path(operation, at), value, at + "/path");
            }
        },
        TEST {
            @Override
            JsonNode apply(JsonNode document, JsonNode operation, String at) {
                String path = path(operation, at);
                if (!get(document, path, at + "/path").equals(value(operation, at))) {
                    throw new InvalidPatchException(at, "test failed: the value at '" + path
                            + "' is not the expected value.");
                }
                return document;
            }
        };

        abstract JsonNode apply(JsonNode document, JsonNode operation, String at);

        static Operation named(String name, String at) {
            return Arrays.stream(values())
                    .filter(operation -> operation.name().equalsIgnoreCase(name))
                    .findFirst()
                    .orElseThrow(() -> new InvalidPatchException(at + "/op", "unknown operation '" + name
                            + "'; use add, remove, replace, move, copy, or test."));
        }
    }

    @Override
    public String mediaType() {
        return JSON_PATCH_JSON;
    }

    @Override
    public JsonNode apply(JsonNode target, JsonNode patch) {
        if (!patch.isArray()) {
            throw new InvalidPatchException("", "a JSON Patch must be an array of operations.");
        }
        JsonNode document = target.deepCopy();
        for (int index = 0; index < patch.size(); index++) {
            JsonNode operation = patch.get(index);
            String at = "/" + index;
            JsonNode op = operation.get("op");
            if (op == null || !op.isString()) {
                throw new InvalidPatchException(at + "/op", "every operation needs an \"op\".");
            }
            document = Operation.named(op.asString(), at).apply(document, operation, at);
        }
        return document;
    }

    private static String path(JsonNode operation, String at) {
        return member(operation, "path", at);
    }

    private static String from(JsonNode operation, String at) {
        return member(operation, "from", at);
    }

    private static JsonNode value(JsonNode operation, String at) {
        JsonNode value = operation.get("value");
        if (value == null) {
            throw new InvalidPatchException(at + "/value", "this operation needs a \"value\".");
        }
        return value;
    }

    private static String member(JsonNode operation, String name, String at) {
        JsonNode value = operation.get(name);
        if (value == null || !value.isString()) {
            throw new InvalidPatchException(at + "/" + name, "this operation needs a \"" + name + "\".");
        }
        String pointer = value.asString();
        if (!pointer.isEmpty() && !pointer.startsWith("/")) {
            throw new InvalidPatchException(at + "/" + name, "'" + pointer + "' is not a JSON Pointer.");
        }
        return pointer;
    }

    /** The reference tokens of a JSON Pointer, unescaped ({@code ~1} is {@code /}, {@code ~0} is {@code ~}). */
    private static List<String> tokens(String pointer) {
        if (pointer.isEmpty()) {
            return List.of();
        }
        return Arrays.stream(pointer.substring(1).split("/", -1))
                .map(token -> token.replace("~1", "/").replace("~0", "~"))
                .toList();
    }

    private static JsonNode get(JsonNode document, String pointer, String at) {
        JsonNode node = document;
        for (String token : tokens(pointer)) {
            node = child(node, token);
            if (node == null) {
                throw missing(pointer, at);
            }
        }
        return node;
    }

    private static JsonNode child(JsonNode node, String token) {
        if (node.isObject()) {
            return node.get(token);
        }
        if (node.isArray() && token.matches("0|[1-9][0-9]*") && Integer.parseInt(token) < node.size()) {
            return node.get(Integer.parseInt(token));
        }
        return null;
    }

    private static JsonNode add(JsonNode document, String pointer, JsonNode value, String at) {
        List<String> tokens = tokens(pointer);
        if (tokens.isEmpty()) {
            return value;
        }
        JsonNode parent = get(document, parentOf(pointer), at);
        String last = tokens.getLast();
        if (parent.isObject()) {
            ((ObjectNode) parent).set(last, value);
        } else if (parent.isArray()) {
            ArrayNode array = (ArrayNode) parent;
            if (last.equals("-")) {
                array.add(value);
            } else if (last.matches("0|[1-9][0-9]*") && Integer.parseInt(last) <= array.size()) {
                array.insert(Integer.parseInt(last), value);
            } else {
                throw missing(pointer, at);
            }
        } else {
            throw missing(pointer, at);
        }
        return document;
    }

    private static void remove(JsonNode document, String pointer, String at) {
        if (pointer.isEmpty()) {
            throw new InvalidPatchException(at, "the whole document cannot be removed.");
        }
        get(document, pointer, at);
        JsonNode parent = get(document, parentOf(pointer), at);
        String last = tokens(pointer).getLast();
        if (parent.isObject()) {
            ((ObjectNode) parent).remove(last);
        } else {
            ((ArrayNode) parent).remove(Integer.parseInt(last));
        }
    }

    private static String parentOf(String pointer) {
        return pointer.substring(0, pointer.lastIndexOf('/'));
    }

    private static InvalidPatchException missing(String pointer, String at) {
        return new InvalidPatchException(at, "there is nothing at '" + pointer + "'.");
    }
}
