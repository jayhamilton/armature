package com.addf.backend.armature.board;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

import org.jmolecules.ddd.annotation.Entity;
import org.jmolecules.ddd.annotation.Identity;

/**
 * One gadget placed on a board: its {@code @type} (for example {@code BarChartGadget}), where it
 * sits, and its property values. Property values vary by gadget type, so they are a JSON object
 * here and JSONB in PostgreSQL (INC-01b).
 *
 * @param type the gadget's {@code @type}
 * @param rowId the row it sits in
 * @param column the column within that row, from 0
 * @param order its position within the column, from 0
 */
@Entity
public record GadgetInstance(@Identity String id, String type, String title, String rowId, int column, int order,
        Map<String, Object> properties) {

    public GadgetInstance {
        // Property values come from JSON, where null is a value, so Map.copyOf (which refuses nulls) will not do.
        properties = properties == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(properties));
    }

    GadgetInstance placedAt(String rowId, int column, int order) {
        return new GadgetInstance(id, type, title, rowId, column, order, properties);
    }
}
