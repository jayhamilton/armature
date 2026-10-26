package com.addf.backend.armature.tmf;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import tools.jackson.databind.JsonNode;

/** The TMF 630 response shape for a queried collection: count headers, and {@code 206} for a partial page. */
public final class TmfResponses {

    public static final String TOTAL_COUNT = "X-Total-Count";
    public static final String RESULT_COUNT = "X-Result-Count";

    private TmfResponses() {
    }

    public static ResponseEntity<List<JsonNode>> page(Page page) {
        return ResponseEntity.status(page.isPartial() ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK)
                .header(TOTAL_COUNT, String.valueOf(page.totalCount()))
                .header(RESULT_COUNT, String.valueOf(page.resultCount()))
                .body(page.items());
    }
}
