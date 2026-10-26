package com.addf.backend.armature.board.internal;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.addf.backend.armature.board.Board;
import com.addf.backend.armature.board.BoardRepository;
import com.addf.backend.armature.patterns.DesignPattern;
import com.addf.backend.armature.patterns.Pattern;
import org.jmolecules.architecture.hexagonal.SecondaryAdapter;
import org.springframework.stereotype.Repository;

/**
 * Boards in memory: the zero setup default, gone when the process stops. Boards are immutable, so
 * keeping the instances themselves is safe; nobody can change a stored board without saving.
 */
@SecondaryAdapter
@Repository
@DesignPattern(pattern = Pattern.ADAPTER, role = "Adapter", doc = "docs/patterns/adapter.md")
public class InMemoryBoardRepository implements BoardRepository {

    private final Map<String, Board> boards = new LinkedHashMap<>();

    @Override
    public synchronized List<Board> findAll() {
        return List.copyOf(boards.values());
    }

    @Override
    public synchronized Optional<Board> findById(String id) {
        return Optional.ofNullable(boards.get(id));
    }

    @Override
    public synchronized Optional<Board> findByGadgetInstanceId(String gadgetInstanceId) {
        return boards.values().stream()
                .filter(board -> board.gadget(gadgetInstanceId).isPresent())
                .findFirst();
    }

    @Override
    public synchronized Board save(Board board) {
        boards.put(board.id(), board);
        return board;
    }

    @Override
    public synchronized boolean deleteById(String id) {
        return boards.remove(id) != null;
    }
}
