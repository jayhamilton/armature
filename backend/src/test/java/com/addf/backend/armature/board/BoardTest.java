package com.addf.backend.armature.board;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import com.addf.backend.armature.problem.InvalidRequestException;
import com.addf.backend.armature.problem.ResourceNotFoundException;
import org.junit.jupiter.api.Test;

/** The {@link Board} aggregate's rules for rows and gadget positions, without HTTP or storage. */
class BoardTest {

    private static final Instant NOW = Instant.parse("2026-10-25T12:00:00Z");

    private final Board empty = Board.create("b", new BoardDetails("Board", null, null, null), new Draft(),
            List.of(new BoardRow("r", RowLayout.TWO_COL_EQUAL)), NOW);

    @Test
    void everyChangeCountsAVersion() {
        Board changed = empty.withDetails(new BoardDetails("Renamed", null, null, null), NOW.plusSeconds(1));
        assertThat(changed.version()).isEqualTo(2);
        assertThat(changed.lastUpdate()).isEqualTo(NOW.plusSeconds(1));
        assertThat(changed.creationDate()).isEqualTo(NOW);
    }

    @Test
    void placingAGadgetPushesTheOthersDown() {
        Board board = empty.withGadgetPlaced(gadget("g1", 0, 0), NOW)
                .withGadgetPlaced(gadget("g2", 0, 99), NOW)
                .withGadgetPlaced(gadget("g3", 0, 0), NOW);
        assertThat(board.column("r", 0)).extracting(GadgetInstance::id).containsExactly("g3", "g1", "g2");
        assertThat(board.column("r", 0)).extracting(GadgetInstance::order).containsExactly(0, 1, 2);
    }

    @Test
    void movingAGadgetClosesTheGapItLeaves() {
        Board board = empty.withGadgetPlaced(gadget("g1", 0, 0), NOW)
                .withGadgetPlaced(gadget("g2", 0, 1), NOW)
                .withGadgetPlaced(gadget("g1", 1, 0), NOW);
        assertThat(board.column("r", 0)).extracting(GadgetInstance::id, GadgetInstance::order)
                .containsExactly(tuple("g2", 0));
        assertThat(board.column("r", 1)).extracting(GadgetInstance::id).containsExactly("g1");
    }

    @Test
    void aNarrowerLayoutMovesGadgetsToItsLastColumn() {
        Board board = empty.withGadgetPlaced(gadget("left", 0, 0), NOW)
                .withGadgetPlaced(gadget("right", 1, 0), NOW)
                .withRowLayout("r", RowLayout.ONE_COL, NOW);
        assertThat(board.column("r", 0)).extracting(GadgetInstance::id).containsExactly("left", "right");
    }

    @Test
    void removingARowRemovesItsGadgets() {
        Board board = empty.withGadgetPlaced(gadget("g1", 0, 0), NOW).withoutRow("r", NOW);
        assertThat(board.rows()).isEmpty();
        assertThat(board.gadgets()).isEmpty();
    }

    @Test
    void aGadgetMustSitInAColumnItsRowHas() {
        assertThatThrownBy(() -> empty.withGadgetPlaced(gadget("g", 2, 0), NOW))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> empty.withGadgetPlaced(new GadgetInstance("g", "T", "t", "nope", 0, 0, Map.of()), NOW))
                .isInstanceOf(InvalidRequestException.class);
        assertThatThrownBy(() -> empty.withoutGadget("missing", NOW)).isInstanceOf(ResourceNotFoundException.class);
        assertThatThrownBy(() -> empty.withRowLayout("missing", RowLayout.ONE_COL, NOW))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void detailsNeedATitleAndAKnownWidth() {
        assertThatThrownBy(() -> new BoardDetails(" ", null, null, "huge").validated())
                .isInstanceOfSatisfying(InvalidRequestException.class,
                        problem -> assertThat(problem.errors()).hasSize(2));
    }

    private static GadgetInstance gadget(String id, int column, int order) {
        return new GadgetInstance(id, "BarChartGadget", id, "r", column, order, Map.of());
    }
}
