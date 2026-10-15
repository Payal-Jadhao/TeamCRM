package com.teamcrm.dto;

import java.time.Instant;

public class ChecklistDtos {

    public record ChecklistItemRequest(
            String text,
            Integer position
    ) {}

    public record ChecklistItemResponse(
            Long id,
            Long taskId,
            String text,
            Boolean isDone,
            Integer position,
            Long doneById,
            String doneByName,
            Instant doneAt
    ) {}
}
