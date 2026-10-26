package com.addf.backend.armature.board;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import com.addf.backend.armature.tmf.InvalidPatchException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * How boards, rows, and gadget instances look on the wire (TMF 630: {@code id}, {@code href},
 * {@code @type} on each), and how a patched representation is read back. Hrefs are relative to the
 * deployment, with no version in the path (ADR-0020).
 */
@Component
public class BoardRepresentations {

    public static final Set<String> BOARD_ATTRIBUTES = Set.of("id", "href", "@type", "title", "description", "icon",
            "contentWidth", "state", "version", "creationDate", "lastUpdate", "rows");
    public static final Set<String> BOARD_EDITABLE = Set.of("title", "description", "icon", "contentWidth");

    public static final Set<String> ROW_ATTRIBUTES = Set.of("id", "href", "@type", "structure", "columns");
    public static final Set<String> ROW_EDITABLE = Set.of("structure");

    public static final Set<String> GADGET_ATTRIBUTES = Set.of("id", "href", "@type", "@baseType", "title", "board",
            "row", "column", "order", "properties");
    public static final Set<String> GADGET_EDITABLE = Set.of("title", "row", "column", "order", "properties");

    /** A reference to another resource: TMF 630's {@code id} plus {@code href}. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Ref(String id, String href, @JsonProperty("@type") String type) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record BoardResource(String id, String href, @JsonProperty("@type") String type, String title,
            String description, String icon, String contentWidth, String state, long version, Instant creationDate,
            Instant lastUpdate, List<RowResource> rows) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RowResource(String id, String href, @JsonProperty("@type") String type, String structure,
            List<ColumnResource> columns) {
    }

    public record ColumnResource(List<Ref> gadgetInstance) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record GadgetInstanceResource(String id, String href, @JsonProperty("@type") String type,
            @JsonProperty("@baseType") String baseType, String title, Ref board, Ref row, int column, int order,
            Map<String, Object> properties) {
    }

    /** {@code POST /board}. {@code rows} lists the layouts of the rows to start with, if any. */
    public record BoardCreate(String title, String description, String icon, String contentWidth,
            List<RowCreate> rows) {
    }

    /** {@code POST /board/{id}/row}, and the editable part of a row. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RowCreate(String structure) {
    }

    /** {@code POST /gadgetInstance}, and the editable part of a gadget instance. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GadgetInstanceWrite(@JsonProperty("@type") String type, String title, Ref board, Ref row,
            Integer column, Integer order, Map<String, Object> properties) {
    }

    private final JsonMapper mapper;

    public BoardRepresentations(JsonMapper mapper) {
        this.mapper = mapper;
    }

    public BoardResource board(Board board) {
        BoardDetails details = board.details();
        return new BoardResource(board.id(), boardHref(board.id()), "Board", details.title(), details.description(),
                details.icon(), details.contentWidth(), board.state().name(), board.version(), board.creationDate(),
                board.lastUpdate(), board.rows().stream().map(row -> row(board, row)).toList());
    }

    public RowResource row(Board board, BoardRow row) {
        List<ColumnResource> columns = IntStream.range(0, row.layout().columnCount())
                .mapToObj(column -> new ColumnResource(board.column(row.id(), column).stream()
                        .map(gadget -> new Ref(gadget.id(), gadgetHref(gadget.id()), gadget.type()))
                        .toList()))
                .toList();
        return new RowResource(row.id(), rowHref(board.id(), row.id()), "BoardRow", row.layout().value(), columns);
    }

    public GadgetInstanceResource gadget(BoardService.PlacedGadget placed) {
        Board board = placed.board();
        GadgetInstance gadget = placed.gadget();
        return new GadgetInstanceResource(gadget.id(), gadgetHref(gadget.id()), gadget.type(), "GadgetInstance",
                gadget.title(), new Ref(board.id(), boardHref(board.id()), "Board"),
                new Ref(gadget.rowId(), rowHref(board.id(), gadget.rowId()), "BoardRow"), gadget.column(),
                gadget.order(), gadget.properties());
    }

    public JsonNode tree(Object representation) {
        return mapper.valueToTree(representation);
    }

    /** Reads the editable part of a patched representation back into a record. */
    public <T> T readPatched(JsonNode patched, Class<T> type) {
        try {
            return mapper.treeToValue(patched, type);
        } catch (JacksonException wrongShape) {
            throw new InvalidPatchException("", "the patched resource has the wrong shape: "
                    + wrongShape.getOriginalMessage());
        }
    }

    public static String boardHref(String boardId) {
        return "/board/" + boardId;
    }

    public static String rowHref(String boardId, String rowId) {
        return boardHref(boardId) + "/row/" + rowId;
    }

    public static String gadgetHref(String gadgetId) {
        return "/gadgetInstance/" + gadgetId;
    }
}
