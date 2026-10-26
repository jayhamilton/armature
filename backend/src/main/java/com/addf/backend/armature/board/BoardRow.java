package com.addf.backend.armature.board;

import org.jmolecules.ddd.annotation.Entity;
import org.jmolecules.ddd.annotation.Identity;

/**
 * A row of a board: a layout that splits it into columns. Which gadget instances sit in which
 * column is recorded on each {@link GadgetInstance}, so moving a gadget changes one thing.
 */
@Entity
public record BoardRow(@Identity String id, RowLayout layout) {
}
