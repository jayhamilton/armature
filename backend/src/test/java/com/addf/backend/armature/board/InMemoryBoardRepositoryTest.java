package com.addf.backend.armature.board;

import com.addf.backend.armature.board.internal.InMemoryBoardRepository;

/** The in memory adapter passes the repository contract. */
class InMemoryBoardRepositoryTest extends BoardRepositoryContract {

    @Override
    protected BoardRepository newRepository() {
        return new InMemoryBoardRepository();
    }
}
