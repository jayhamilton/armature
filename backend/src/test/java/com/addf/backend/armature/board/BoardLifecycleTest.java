package com.addf.backend.armature.board;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import com.addf.backend.armature.lifecycle.TransitionNotAllowedException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

/**
 * Every state and event pair of the board lifecycle (4 states by 5 events = 20 cases). The
 * expected transitions are written out here as a table, independently of the state classes, so a
 * change to the lifecycle must change this table too.
 */
class BoardLifecycleTest {

    private final BoardLifecycle lifecycle = new BoardLifecycle();

    private static final List<BoardState> STATES =
            List.of(new Draft(), new Published(), new Locked(), new Archived());

    /** The allowed transitions: state name, then event to target state. Everything else is refused. */
    private static final Map<String, Map<BoardEvent, BoardState>> ALLOWED = Map.of(
            "DRAFT", Map.of(BoardEvent.PUBLISH, new Published(), BoardEvent.DISCARD, new Archived()),
            "PUBLISHED", Map.of(BoardEvent.LOCK, new Locked(), BoardEvent.ARCHIVE, new Archived()),
            "LOCKED", Map.of(BoardEvent.UNLOCK, new Published()),
            "ARCHIVED", Map.of());

    static Stream<Arguments> everyStateAndEvent() {
        return STATES.stream()
                .flatMap(state -> Stream.of(BoardEvent.values()).map(event -> Arguments.of(state, event)));
    }

    @Test
    void newBoardsStartAsDrafts() {
        assertThat(lifecycle.initialState()).isEqualTo(new Draft());
    }

    @ParameterizedTest(name = "{0} + {1}")
    @MethodSource("everyStateAndEvent")
    void firesOnlyTheAllowedTransitions(BoardState state, BoardEvent event) {
        BoardState expected = ALLOWED.get(state.name()).get(event);

        if (expected != null) {
            assertThat(lifecycle.fire(state, event)).isEqualTo(expected);
        } else {
            assertThatThrownBy(() -> lifecycle.fire(state, event))
                    .isInstanceOf(TransitionNotAllowedException.class)
                    .hasMessage("Event " + event + " is not allowed in state " + state.name());
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("states")
    void allowedEventsMatchTheTransitionsAStateAccepts(BoardState state) {
        assertThat(lifecycle.allowedEvents(state)).isEqualTo(ALLOWED.get(state.name()).keySet());
    }

    static Stream<BoardState> states() {
        return STATES.stream();
    }
}
