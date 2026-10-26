package com.addf.backend.armature.board;

import java.net.URI;
import java.util.List;
import java.util.stream.IntStream;

import com.addf.backend.armature.board.BoardRepresentations.BoardCreate;
import com.addf.backend.armature.board.BoardRepresentations.BoardResource;
import com.addf.backend.armature.tmf.PatchStrategies;
import com.addf.backend.armature.tmf.PatchStrategy;
import com.addf.backend.armature.tmf.QueryEngine;
import com.addf.backend.armature.tmf.QueryParameters;
import com.addf.backend.armature.tmf.TmfResponses;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.jmolecules.architecture.hexagonal.PrimaryAdapter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;

/**
 * {@code /board}: boards as TMF 630 resources. Translates HTTP into {@link BoardService} calls and
 * nothing else; querying and patching come from the {@code tmf} module, errors from {@code problem}.
 */
@PrimaryAdapter
@RestController
@CrossOrigin
@Tag(name = "Boards", description = "Boards, TMF 630 style")
@ApiResponse(responseCode = "4XX", description = "A problem (RFC 9457)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE))
@RequestMapping(path = "/board", produces = MediaType.APPLICATION_JSON_VALUE)
public class BoardController {

    private final BoardService boards;
    private final BoardRepresentations representations;
    private final QueryEngine queries;
    private final PatchStrategies patches;

    public BoardController(BoardService boards, BoardRepresentations representations, QueryEngine queries,
            PatchStrategies patches) {
        this.boards = boards;
        this.representations = representations;
        this.queries = queries;
        this.patches = patches;
    }

    @Operation(summary = "List boards", description = "Supports fields, filtering, sort, offset, and limit.")
    @GetMapping
    public ResponseEntity<List<JsonNode>> list(@RequestParam MultiValueMap<String, String> query) {
        List<BoardResource> all = boards.boards().stream().map(representations::board).toList();
        return TmfResponses.page(queries.apply(all, QueryParameters.parse(query),
                BoardRepresentations.BOARD_ATTRIBUTES));
    }

    @Operation(summary = "Create a board", description = "The board starts in the DRAFT state.")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<BoardResource> create(@RequestBody BoardCreate request) {
        List<RowLayout> layouts = request.rows() == null ? List.of()
                : IntStream.range(0, request.rows().size())
                        .mapToObj(index -> RowLayout.parse(request.rows().get(index).structure(),
                                "/rows/" + index + "/structure"))
                        .toList();
        BoardDetails details = new BoardDetails(request.title(), request.description(), request.icon(),
                request.contentWidth());
        BoardResource created = representations.board(boards.create(details, layouts));
        return ResponseEntity.created(URI.create(created.href())).body(created);
    }

    @Operation(summary = "Read a board", description = "Supports fields.")
    @GetMapping("/{id}")
    public JsonNode read(@PathVariable String id, @RequestParam MultiValueMap<String, String> query) {
        return queries.select(representations.board(boards.board(id)), QueryParameters.fieldsOnly(query),
                BoardRepresentations.BOARD_ATTRIBUTES);
    }

    @Operation(summary = "Change a board's title, description, icon, or content width",
            description = "application/merge-patch+json or application/json-patch+json. Rows change through "
                    + "their own resource.")
    @PatchMapping(path = "/{id}", consumes = { PatchStrategy.MERGE_PATCH_JSON, PatchStrategy.JSON_PATCH_JSON })
    public BoardResource patch(@PathVariable String id, @RequestHeader(HttpHeaders.CONTENT_TYPE) String contentType,
            @RequestBody JsonNode patch) {
        JsonNode current = representations.tree(representations.board(boards.board(id)));
        JsonNode patched = patches.apply(MediaType.parseMediaType(contentType), current, patch,
                BoardRepresentations.BOARD_EDITABLE);
        return representations.board(boards.describe(id, representations.readPatched(patched, BoardDetails.class)));
    }

    @Operation(summary = "Delete a board")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boards.delete(id);
        return ResponseEntity.noContent().build();
    }
}
