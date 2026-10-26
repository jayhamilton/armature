package com.addf.backend.armature.board;

import java.util.List;
import java.util.Optional;

import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import com.addf.backend.armature.patterns.Principle;
import com.addf.backend.armature.patterns.SolidPrinciple;
import org.jmolecules.architecture.hexagonal.SecondaryPort;

/**
 * Where boards are kept: whole aggregates in, whole aggregates out.
 *
 * <h2>Pattern</h2>
 * Adapter, from the domain's side: this is the port, and each storage technology is an adapter.
 *
 * <h2>Principle</h2>
 * Liskov substitution: every adapter passes the same {@code BoardRepositoryContract} test suite,
 * so {@link BoardService} cannot tell which one it has.
 *
 * <h2>Why here</h2>
 * Two adapters are in the plan (ADR-0003): in memory, the zero setup demo default, here; and
 * PostgreSQL through Spring Data JDBC in INC-01b.
 *
 * <h2>How to extend</h2>
 * Implement this interface as a {@code @SecondaryAdapter} and extend {@code BoardRepositoryContract}
 * in its test.
 *
 * <h2>See also</h2>
 * {@code docs/adr/0003-postgresql-spring-data-jdbc.md}.
 */
@SecondaryPort
@DesignPattern(pattern = Pattern.ADAPTER, role = "Target", doc = "docs/patterns/adapter.md")
@SolidPrinciple(value = Principle.LISKOV_SUBSTITUTION, note = "Every adapter passes BoardRepositoryContract.")
public interface BoardRepository {

    /** Every board, oldest first. */
    List<Board> findAll();

    Optional<Board> findById(String id);

    /** The board that holds the given gadget instance. */
    Optional<Board> findByGadgetInstanceId(String gadgetInstanceId);

    /** Inserts the board, or replaces the board with the same id. */
    Board save(Board board);

    /** @return whether a board was removed */
    boolean deleteById(String id);
}
