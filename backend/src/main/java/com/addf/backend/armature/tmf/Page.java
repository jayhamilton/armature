package com.addf.backend.armature.tmf;

import java.util.List;

import tools.jackson.databind.JsonNode;

/**
 * One page of a queried collection.
 *
 * @param items the resources on this page, with only the selected fields
 * @param totalCount how many resources matched the filters ({@code X-Total-Count})
 */
public record Page(List<JsonNode> items, int totalCount) {

    public Page {
        items = List.copyOf(items);
    }

    /** How many resources this page holds ({@code X-Result-Count}). */
    public int resultCount() {
        return items.size();
    }

    /** Whether more matched than this page holds, which TMF 630 answers with {@code 206 Partial Content}. */
    public boolean isPartial() {
        return resultCount() < totalCount;
    }
}
