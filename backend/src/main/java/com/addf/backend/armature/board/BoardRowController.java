package com.addf.backend.armature.board;

import java.net.URI;
import java.util.List;

import com.addf.backend.armature.board.BoardRepresentations.RowCreate;
import com.addf.backend.armature.board.BoardRepresentations.RowResource;
import com.addf.backend.armature.problem.ResourceNotFoundException;
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
 * {@code /board/{boardId}/row}: the rows of one board. A row's columns list the gadget instances
 * in them; to move a gadget, patch the gadget instance, not the row.
 */
@PrimaryAdapter
@RestController
@CrossOrigin
@Tag(name = "Board rows", description = "Rows of a board, TMF 630 style")
@ApiResponse(responseCode = "4XX", description = "A problem (RFC 9457)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE))
@RequestMapping(path = "/board/{boardId}/row", produces = MediaType.APPLICATION_JSON_VALUE)
public class BoardRowController {

    private final BoardService boards;
    private final BoardRepresentations representations;
    private final QueryEngine queries;
    private final PatchStrategies patches;

    public BoardRowController(BoardService boards, BoardRepresentations representations, QueryEngine queries,
            PatchStrategies patches) {
        this.boards = boards;
        this.representations = representations;
        this.queries = queries;
        this.patches = patches;
    }

    @Operation(summary = "List a board's rows", description = "Supports fields, filtering, sort, offset, and limit.")
    @GetMapping
    public ResponseEntity<List<JsonNode>> list(@PathVariable String boardId,
            @RequestParam MultiValueMap<String, String> query) {
        Board board = boards.board(boardId);
        List<RowResource> rows = board.rows().stream().map(row -> representations.row(board, row)).toList();
        return TmfResponses.page(queries.apply(rows, QueryParameters.parse(query), BoardRepresentations.ROW_ATTRIBUTES));
    }

    @Operation(summary = "Add a row at the bottom of a board")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RowResource> create(@PathVariable String boardId, @RequestBody RowCreate request) {
        Board board = boards.addRow(boardId, RowLayout.parse(request.structure(), "/structure"));
        RowResource created = representations.row(board, board.rows().getLast());
        return ResponseEntity.created(URI.create(created.href())).body(created);
    }

    @Operation(summary = "Read a row", description = "Supports fields.")
    @GetMapping("/{rowId}")
    public JsonNode read(@PathVariable String boardId, @PathVariable String rowId,
            @RequestParam MultiValueMap<String, String> query) {
        Board board = boards.board(boardId);
        return queries.select(representations.row(board, row(board, rowId)), QueryParameters.fieldsOnly(query),
                BoardRepresentations.ROW_ATTRIBUTES);
    }

    @Operation(summary = "Change a row's layout",
            description = "Gadgets in columns the new layout lacks move to the bottom of its last column.")
    @PatchMapping(path = "/{rowId}", consumes = { PatchStrategy.MERGE_PATCH_JSON, PatchStrategy.JSON_PATCH_JSON })
    public RowResource patch(@PathVariable String boardId, @PathVariable String rowId,
            @RequestHeader(HttpHeaders.CONTENT_TYPE) String contentType, @RequestBody JsonNode patch) {
        Board board = boards.board(boardId);
        JsonNode current = representations.tree(representations.row(board, row(board, rowId)));
        JsonNode patched = patches.apply(MediaType.parseMediaType(contentType), current, patch,
                BoardRepresentations.ROW_EDITABLE);
        RowCreate edit = representations.readPatched(patched, RowCreate.class);
        Board changed = boards.changeRowLayout(boardId, rowId, RowLayout.parse(edit.structure(), "/structure"));
        return representations.row(changed, row(changed, rowId));
    }

    @Operation(summary = "Remove a row and the gadget instances in it")
    @DeleteMapping("/{rowId}")
    public ResponseEntity<Void> delete(@PathVariable String boardId, @PathVariable String rowId) {
        boards.removeRow(boardId, rowId);
        return ResponseEntity.noContent().build();
    }

    private static BoardRow row(Board board, String rowId) {
        return board.row(rowId).orElseThrow(() -> new ResourceNotFoundException("row", rowId));
    }
}
