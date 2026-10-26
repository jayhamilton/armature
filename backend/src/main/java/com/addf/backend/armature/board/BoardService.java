package com.addf.backend.armature.board;

import java.time.Clock;
import java.util.List;
import java.util.UUID;
import java.util.function.UnaryOperator;

import com.addf.backend.armature.problem.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * The only way boards change. Controllers (and, from INC-03, the agent's tools) translate their
 * protocol into these calls; every rule about what a change may do lives in {@link Board}.
 */
@Service
public class BoardService {

    private final BoardRepository repository;
    private final BoardLifecycle lifecycle;
    private final Clock clock;

    @Autowired
    public BoardService(BoardRepository repository, BoardLifecycle lifecycle) {
        this(repository, lifecycle, Clock.systemUTC());
    }

    BoardService(BoardRepository repository, BoardLifecycle lifecycle, Clock clock) {
        this.repository = repository;
        this.lifecycle = lifecycle;
        this.clock = clock;
    }

    public List<Board> boards() {
        return repository.findAll();
    }

    public Board board(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("board", id));
    }

    /** A new board starts in the lifecycle's initial state, with one row per layout given. */
    public Board create(BoardDetails details, List<RowLayout> rowLayouts) {
        List<BoardRow> rows = rowLayouts.stream().map(layout -> new BoardRow(newId(), layout)).toList();
        return repository.save(Board.create(newId(), details.validated(), lifecycle.initialState(), rows, clock.instant()));
    }

    public Board describe(String id, BoardDetails details) {
        BoardDetails valid = details.validated();
        return change(id, board -> board.withDetails(valid, clock.instant()));
    }

    public void delete(String id) {
        if (!repository.deleteById(id)) {
            throw new ResourceNotFoundException("board", id);
        }
    }

    public Board addRow(String boardId, RowLayout layout) {
        return change(boardId, board -> board.withRowAdded(new BoardRow(newId(), layout), clock.instant()));
    }

    public Board changeRowLayout(String boardId, String rowId, RowLayout layout) {
        return change(boardId, board -> board.withRowLayout(rowId, layout, clock.instant()));
    }

    public Board removeRow(String boardId, String rowId) {
        return change(boardId, board -> board.withoutRow(rowId, clock.instant()));
    }

    /** Every gadget instance on every board, with the board that holds it. */
    public List<PlacedGadget> gadgetInstances() {
        return repository.findAll().stream()
                .flatMap(board -> board.gadgets().stream().map(gadget -> new PlacedGadget(board, gadget)))
                .toList();
    }

    public PlacedGadget gadgetInstance(String id) {
        Board board = boardHolding(id);
        return new PlacedGadget(board, board.gadget(id).orElseThrow());
    }

    /**
     * Places a new gadget instance on a board.
     *
     * @param gadget the instance; its id is ignored and a new one assigned
     */
    public PlacedGadget addGadgetInstance(String boardId, GadgetInstance gadget) {
        GadgetInstance placed = new GadgetInstance(newId(), gadget.type(), gadget.title(), gadget.rowId(),
                gadget.column(), gadget.order(), gadget.properties());
        Board board = change(boardId, current -> current.withGadgetPlaced(placed, clock.instant()));
        return new PlacedGadget(board, board.gadget(placed.id()).orElseThrow());
    }

    /** Replaces a gadget instance's title, properties, or position. Its id and type never change. */
    public PlacedGadget updateGadgetInstance(GadgetInstance gadget) {
        Board holder = boardHolding(gadget.id());
        Board board = change(holder.id(), current -> current.withGadgetPlaced(gadget, clock.instant()));
        return new PlacedGadget(board, board.gadget(gadget.id()).orElseThrow());
    }

    public void removeGadgetInstance(String id) {
        Board holder = boardHolding(id);
        change(holder.id(), board -> board.withoutGadget(id, clock.instant()));
    }

    private Board boardHolding(String gadgetInstanceId) {
        return repository.findByGadgetInstanceId(gadgetInstanceId)
                .orElseThrow(() -> new ResourceNotFoundException("gadget instance", gadgetInstanceId));
    }

    private Board change(String boardId, UnaryOperator<Board> change) {
        return repository.save(change.apply(board(boardId)));
    }

    private static String newId() {
        return UUID.randomUUID().toString();
    }

    /** A gadget instance together with the board it sits on, which its representation needs. */
    public record PlacedGadget(Board board, GadgetInstance gadget) {
    }
}
