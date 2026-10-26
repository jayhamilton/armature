package com.addf.backend.armature.board;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

import com.addf.backend.armature.board.BoardRepresentations.GadgetInstanceResource;
import com.addf.backend.armature.board.BoardRepresentations.GadgetInstanceWrite;
import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.InvalidRequestException;
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
 * {@code /gadgetInstance}: every gadget placed on any board, as one collection, so a client can
 * ask for {@code ?board.id=...} or {@code ?@type=BarChartGadget} without walking boards. Each
 * instance is still saved as part of its board.
 */
@PrimaryAdapter
@RestController
@CrossOrigin
@Tag(name = "Gadget instances", description = "Gadgets placed on boards, TMF 630 style")
@ApiResponse(responseCode = "4XX", description = "A problem (RFC 9457)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE))
@RequestMapping(path = "/gadgetInstance", produces = MediaType.APPLICATION_JSON_VALUE)
public class GadgetInstanceController {

    private final BoardService boards;
    private final BoardRepresentations representations;
    private final QueryEngine queries;
    private final PatchStrategies patches;

    public GadgetInstanceController(BoardService boards, BoardRepresentations representations, QueryEngine queries,
            PatchStrategies patches) {
        this.boards = boards;
        this.representations = representations;
        this.queries = queries;
        this.patches = patches;
    }

    @Operation(summary = "List gadget instances", description = "Supports fields, filtering (for example "
            + "board.id), sort, offset, and limit.")
    @GetMapping
    public ResponseEntity<List<JsonNode>> list(@RequestParam MultiValueMap<String, String> query) {
        List<GadgetInstanceResource> all = boards.gadgetInstances().stream().map(representations::gadget).toList();
        return TmfResponses.page(queries.apply(all, QueryParameters.parse(query),
                BoardRepresentations.GADGET_ATTRIBUTES));
    }

    @Operation(summary = "Place a gadget on a board", description = "Names the board, row, and column; "
            + "order is the position in the column, last when omitted.")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<GadgetInstanceResource> create(@RequestBody GadgetInstanceWrite request) {
        List<FieldProblem> problems = new ArrayList<>();
        if (request.type() == null || request.type().isBlank()) {
            problems.add(new FieldProblem("/@type", "a gadget instance needs the gadget's @type."));
        }
        if (request.board() == null || request.board().id() == null) {
            problems.add(new FieldProblem("/board/id", "name the board to place the gadget on."));
        }
        if (request.row() == null || request.row().id() == null) {
            problems.add(new FieldProblem("/row/id", "name the row to place the gadget in."));
        }
        if (!problems.isEmpty()) {
            throw new InvalidRequestException(problems);
        }
        GadgetInstance gadget = new GadgetInstance(null, request.type(), request.title(), request.row().id(),
                request.column() == null ? 0 : request.column(),
                request.order() == null ? Integer.MAX_VALUE : request.order(), request.properties());
        GadgetInstanceResource created = representations.gadget(boards.addGadgetInstance(request.board().id(), gadget));
        return ResponseEntity.created(URI.create(created.href())).body(created);
    }

    @Operation(summary = "Read a gadget instance", description = "Supports fields.")
    @GetMapping("/{id}")
    public JsonNode read(@PathVariable String id, @RequestParam MultiValueMap<String, String> query) {
        return queries.select(representations.gadget(boards.gadgetInstance(id)), QueryParameters.fieldsOnly(query),
                BoardRepresentations.GADGET_ATTRIBUTES);
    }

    @Operation(summary = "Change a gadget instance's title, properties, or position",
            description = "Move it by changing row.id, column, or order; the row must be on the same board.")
    @PatchMapping(path = "/{id}", consumes = { PatchStrategy.MERGE_PATCH_JSON, PatchStrategy.JSON_PATCH_JSON })
    public GadgetInstanceResource patch(@PathVariable String id,
            @RequestHeader(HttpHeaders.CONTENT_TYPE) String contentType, @RequestBody JsonNode patch) {
        BoardService.PlacedGadget current = boards.gadgetInstance(id);
        JsonNode patched = patches.apply(MediaType.parseMediaType(contentType),
                representations.tree(representations.gadget(current)), patch, BoardRepresentations.GADGET_EDITABLE);
        GadgetInstanceWrite edit = representations.readPatched(patched, GadgetInstanceWrite.class);
        if (edit.row() == null || edit.row().id() == null || edit.column() == null || edit.order() == null) {
            throw new InvalidRequestException(List.of(new FieldProblem("/row",
                    "row.id, column, and order cannot be removed; change them instead.")));
        }
        GadgetInstance changed = new GadgetInstance(id, current.gadget().type(), edit.title(), edit.row().id(),
                edit.column(), edit.order(), edit.properties());
        return representations.gadget(boards.updateGadgetInstance(changed));
    }

    @Operation(summary = "Remove a gadget instance from its board")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boards.removeGadgetInstance(id);
        return ResponseEntity.noContent().build();
    }
}
