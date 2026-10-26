package com.addf.backend.armature.board;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * What every {@link BoardRepository} adapter must do (Liskov substitution, plan "SOLID, applied
 * concretely"). Each adapter's test extends this class and supplies a fresh, empty repository;
 * the in memory adapter runs it now, the PostgreSQL adapter in INC-01b.
 */
public abstract class BoardRepositoryContract {

    private static final Instant NOW = Instant.parse("2026-10-25T12:00:00Z");

    private BoardRepository repository;

    /** A new, empty repository for each test. */
    protected abstract BoardRepository newRepository();

    @BeforeEach
    void freshRepository() {
        repository = newRepository();
    }

    @Test
    void aSavedBoardLoadsWithItsRowsAndGadgetsAsOneUnit() {
        Board board = board("one").withGadgetPlaced(
                new GadgetInstance("g", "BarChartGadget", "Usage", "r", 1, 0, Map.of("showLegend", true)), NOW);
        repository.save(board);

        Board loaded = repository.findById("one").orElseThrow();
        assertThat(loaded).isEqualTo(board);
        assertThat(loaded.gadget("g").orElseThrow().properties()).containsEntry("showLegend", true);
    }

    @Test
    void saveReplacesTheBoardWithTheSameId() {
        repository.save(board("one"));
        repository.save(board("one").withDetails(new BoardDetails("Renamed", null, null, null), NOW));
        assertThat(repository.findAll()).singleElement()
                .satisfies(board -> assertThat(board.details().title()).isEqualTo("Renamed"));
    }

    @Test
    void findAllReturnsOldestFirst() {
        repository.save(board("first"));
        repository.save(board("second"));
        assertThat(repository.findAll()).extracting(Board::id).containsExactly("first", "second");
    }

    @Test
    void findsTheBoardHoldingAGadgetInstance() {
        repository.save(board("other"));
        repository.save(board("holder").withGadgetPlaced(
                new GadgetInstance("g", "TableGadget", "Bills", "r", 0, 0, Map.of()), NOW));
        assertThat(repository.findByGadgetInstanceId("g")).map(Board::id).hasValue("holder");
        assertThat(repository.findByGadgetInstanceId("missing")).isEmpty();
    }

    @Test
    void deleteReportsWhetherABoardWasRemoved() {
        repository.save(board("one"));
        assertThat(repository.deleteById("one")).isTrue();
        assertThat(repository.deleteById("one")).isFalse();
        assertThat(repository.findById("one")).isEmpty();
    }

    private static Board board(String id) {
        return Board.create(id, new BoardDetails("Board " + id, null, null, null), new Draft(),
                List.of(new BoardRow("r", RowLayout.TWO_COL_EQUAL)), NOW);
    }
}
