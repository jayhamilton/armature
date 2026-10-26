package com.addf.backend.armature.board;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import com.addf.backend.armature.problem.FieldProblem;
import com.addf.backend.armature.problem.InvalidRequestException;
import com.addf.backend.armature.problem.ResourceNotFoundException;
import org.jmolecules.ddd.annotation.AggregateRoot;
import org.jmolecules.ddd.annotation.Identity;

/**
 * A board: its details, lifecycle state, rows, and the gadget instances placed on them, saved and
 * loaded as one unit (plan, "Aggregates, not entity graphs").
 *
 * <p>A board is immutable. Every change returns a new board with {@code version} one higher and
 * {@code lastUpdate} set, so the version always counts changes (INC-01b exposes it as the
 * {@code ETag}). Every change also keeps gadget positions tidy: within each column, {@code order}
 * runs 0, 1, 2 with no gaps.
 */
@AggregateRoot
public record Board(@Identity String id, BoardDetails details, BoardState state, long version, Instant creationDate,
        Instant lastUpdate, List<BoardRow> rows, List<GadgetInstance> gadgets) {

    public Board {
        rows = List.copyOf(rows);
        gadgets = List.copyOf(gadgets);
    }

    static Board create(String id, BoardDetails details, BoardState initialState, List<BoardRow> rows, Instant now) {
        return new Board(id, details, initialState, 1, now, now, rows, List.of());
    }

    public Optional<BoardRow> row(String rowId) {
        return rows.stream().filter(row -> row.id().equals(rowId)).findFirst();
    }

    public Optional<GadgetInstance> gadget(String gadgetId) {
        return gadgets.stream().filter(gadget -> gadget.id().equals(gadgetId)).findFirst();
    }

    /** The gadget instances in one column of one row, top to bottom. */
    public List<GadgetInstance> column(String rowId, int column) {
        return gadgets.stream()
                .filter(gadget -> gadget.rowId().equals(rowId) && gadget.column() == column)
                .sorted(Comparator.comparingInt(GadgetInstance::order))
                .toList();
    }

    Board withDetails(BoardDetails newDetails, Instant now) {
        return new Board(id, newDetails, state, version + 1, creationDate, now, rows, gadgets);
    }

    Board withRowAdded(BoardRow row, Instant now) {
        List<BoardRow> newRows = new ArrayList<>(rows);
        newRows.add(row);
        return new Board(id, details, state, version + 1, creationDate, now, newRows, gadgets);
    }

    /**
     * Changes a row's layout. Gadgets in columns the new layout no longer has move to the bottom of
     * its last column, in their old order, so nothing is lost.
     */
    Board withRowLayout(String rowId, RowLayout layout, Instant now) {
        requireRow(rowId);
        List<BoardRow> newRows = rows.stream()
                .map(row -> row.id().equals(rowId) ? new BoardRow(rowId, layout) : row)
                .toList();
        int lastColumn = layout.columnCount() - 1;
        List<GadgetInstance> moved = gadgets.stream()
                .filter(gadget -> gadget.rowId().equals(rowId) && gadget.column() > lastColumn)
                .sorted(Comparator.comparingInt(GadgetInstance::column).thenComparingInt(GadgetInstance::order))
                .toList();
        List<GadgetInstance> newGadgets = new ArrayList<>(gadgets);
        newGadgets.removeAll(moved);
        int next = column(rowId, lastColumn).size();
        for (GadgetInstance gadget : moved) {
            newGadgets.add(gadget.placedAt(rowId, lastColumn, next++));
        }
        return new Board(id, details, state, version + 1, creationDate, now, newRows, newGadgets);
    }

    /** Removes a row and every gadget instance in it. */
    Board withoutRow(String rowId, Instant now) {
        requireRow(rowId);
        return new Board(id, details, state, version + 1, creationDate, now,
                rows.stream().filter(row -> !row.id().equals(rowId)).toList(),
                gadgets.stream().filter(gadget -> !gadget.rowId().equals(rowId)).toList());
    }

    /**
     * Places a gadget instance, new or already on this board, at its {@code rowId}, {@code column},
     * and {@code order}; the gadgets below it in that column move down one. An {@code order} past
     * the end of the column puts it last.
     */
    Board withGadgetPlaced(GadgetInstance gadget, Instant now) {
        BoardRow row = row(gadget.rowId()).orElseThrow(() -> invalid("/row/id",
                "this board has no row '" + gadget.rowId() + "'."));
        if (gadget.column() < 0 || gadget.column() >= row.layout().columnCount()) {
            throw invalid("/column", "row '" + row.id() + "' has columns 0 to " + (row.layout().columnCount() - 1) + ".");
        }
        Board without = new Board(id, details, state, version, creationDate, lastUpdate, rows,
                gadgets.stream().filter(existing -> !existing.id().equals(gadget.id())).toList()).tidied();
        List<GadgetInstance> columnGadgets = new ArrayList<>(without.column(gadget.rowId(), gadget.column()));
        columnGadgets.add(Math.clamp(gadget.order(), 0, columnGadgets.size()), gadget);
        List<GadgetInstance> newGadgets = new ArrayList<>(without.gadgets);
        newGadgets.removeAll(columnGadgets);
        for (int position = 0; position < columnGadgets.size(); position++) {
            newGadgets.add(columnGadgets.get(position).placedAt(gadget.rowId(), gadget.column(), position));
        }
        return new Board(id, details, state, version + 1, creationDate, now, rows, newGadgets);
    }

    Board withoutGadget(String gadgetId, Instant now) {
        if (gadget(gadgetId).isEmpty()) {
            throw new ResourceNotFoundException("gadget instance", gadgetId);
        }
        return new Board(id, details, state, version + 1, creationDate, now, rows,
                gadgets.stream().filter(gadget -> !gadget.id().equals(gadgetId)).toList()).tidied();
    }

    /** Renumbers {@code order} in every column to 0, 1, 2, keeping the relative order. */
    private Board tidied() {
        List<GadgetInstance> tidy = new ArrayList<>();
        for (BoardRow row : rows) {
            for (int column = 0; column < row.layout().columnCount(); column++) {
                List<GadgetInstance> inColumn = column(row.id(), column);
                for (int position = 0; position < inColumn.size(); position++) {
                    tidy.add(inColumn.get(position).placedAt(row.id(), column, position));
                }
            }
        }
        return new Board(id, details, state, version, creationDate, lastUpdate, rows, tidy);
    }

    private void requireRow(String rowId) {
        if (row(rowId).isEmpty()) {
            throw new ResourceNotFoundException("row", rowId);
        }
    }

    private static InvalidRequestException invalid(String pointer, String detail) {
        return new InvalidRequestException(List.of(new FieldProblem(pointer, detail)));
    }
}
