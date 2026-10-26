package com.addf.backend.armature;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Replays {@code backend/http/board-resources.http} against the application, request by request,
 * and checks each response's status against the request's {@code # @expect} comment. The file is
 * the TMF 630 walkthrough a person runs by hand; this test keeps it true.
 *
 * <p>It understands the small part of the VS Code REST Client format the file uses: {@code ###}
 * separators, {@code @name = value} variables, {@code # @name} on a request, and references such
 * as {@code {{board.response.body.$.id}}}.
 */
class HttpFileTest extends ApiTest {

    private static final Path FILE = Path.of("http/board-resources.http");
    private static final Pattern REFERENCE = Pattern.compile("\\{\\{(\\w+)\\.response\\.body\\.\\$\\.([\\w.]+)}}");
    private static final Pattern VARIABLE = Pattern.compile("^@(\\w+)\\s*=\\s*(.*)$");
    private static final JsonMapper JSON = JsonMapper.builder().build();

    record Request(String title, String name, int expect, HttpMethod method, String url, Map<String, String> headers,
            String body) {
    }

    @Test
    void everyRequestInTheHttpFileReturnsItsExpectedStatus() throws IOException {
        List<Request> requests = parse(Files.readString(FILE));
        assertThat(requests).as("requests in %s", FILE).hasSizeGreaterThan(20);

        Map<String, JsonNode> responses = new HashMap<>();
        for (Request request : requests) {
            String url = resolve(request.url(), responses);
            var spec = client.method(request.method()).uri(URI.create(url));
            request.headers().forEach(spec::header);
            if (!request.body().isBlank()) {
                spec.body(resolve(request.body(), responses));
            }
            EntityExchangeResult<String> result = spec.exchange().expectBody(String.class).returnResult();

            assertThat(result.getStatus().value())
                    .as("%s %s (%s): %s", request.method(), url, request.title(), result.getResponseBody())
                    .isEqualTo(request.expect());
            if (request.name() != null) {
                responses.put(request.name(), JSON.readTree(result.getResponseBody()));
            }
        }
    }

    private static List<Request> parse(String file) {
        Map<String, String> variables = new HashMap<>();
        List<Request> requests = new ArrayList<>();
        String[] blocks = file.replace("\r\n", "\n").split("\n###");
        for (String line : blocks[0].split("\n")) {
            Matcher variable = VARIABLE.matcher(line);
            if (variable.matches()) {
                variables.put(variable.group(1), variable.group(2).trim());
            }
        }
        for (int index = 1; index < blocks.length; index++) {
            requests.add(parseRequest(blocks[index], variables));
        }
        return requests;
    }

    private static Request parseRequest(String block, Map<String, String> variables) {
        String[] lines = block.split("\n", -1);
        String title = lines[0].trim();
        String name = null;
        int expect = -1;
        int line = 1;
        for (; line < lines.length && (lines[line].startsWith("#") || lines[line].isBlank()); line++) {
            String comment = lines[line].replaceFirst("^#\\s*", "");
            if (comment.startsWith("@name ")) {
                name = comment.substring(6).trim();
            } else if (comment.startsWith("@expect ")) {
                expect = Integer.parseInt(comment.substring(8).trim());
            }
        }
        String[] requestLine = substitute(lines[line++], variables).split(" ", 2);
        Map<String, String> headers = new HashMap<>();
        for (; line < lines.length && !lines[line].isBlank(); line++) {
            String[] header = lines[line].split(":", 2);
            headers.put(header[0].trim(), header[1].trim());
        }
        StringBuilder body = new StringBuilder();
        for (; line < lines.length; line++) {
            body.append(lines[line]).append('\n');
        }
        assertThat(expect).as("# @expect on '%s'", title).isPositive();
        String url = requestLine[1].trim().replaceFirst("^http://localhost:\\d+", "");
        return new Request(title, name, expect, HttpMethod.valueOf(requestLine[0]), url, headers, body.toString());
    }

    private static String substitute(String text, Map<String, String> variables) {
        String result = text;
        for (var variable : variables.entrySet()) {
            result = result.replace("{{" + variable.getKey() + "}}", variable.getValue());
        }
        return result;
    }

    private static String resolve(String text, Map<String, JsonNode> responses) {
        Matcher reference = REFERENCE.matcher(text);
        StringBuilder result = new StringBuilder();
        while (reference.find()) {
            JsonNode node = responses.get(reference.group(1));
            assertThat(node).as("an earlier request named %s", reference.group(1)).isNotNull();
            for (String part : reference.group(2).split("\\.")) {
                node = node.get(part);
            }
            reference.appendReplacement(result, Matcher.quoteReplacement(node.asString()));
        }
        reference.appendTail(result);
        return result.toString();
    }
}
