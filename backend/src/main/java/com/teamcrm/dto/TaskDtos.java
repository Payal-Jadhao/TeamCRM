package com.teamcrm.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;

public class TaskDtos {

    public record CreateTaskRequest(
            Long projectId,
            @NotBlank String title,
            String description,
            String type,      // FEATURE, BUG, QUERY, CHORE
            String priority,  // LOW, MEDIUM, HIGH, URGENT
            Long assigneeId,
            String assigneeIds,
            LocalDate dueDate,
            BigDecimal estimatedHours,
            String labels,
            Long linkedLeadId,
            Long linkedCustomerId,
            Long linkedDealId,
            Boolean checklistMustBeCompleted
    ) {}

    public record UpdateTaskRequest(
            String title,
            String description,
            String type,
            String priority,
            String status,    // TODO, IN_PROGRESS, REVIEW, DONE, BLOCKED
            Long assigneeId,
            String assigneeIds,
            LocalDate dueDate,
            BigDecimal estimatedHours,
            String labels,
            Long linkedLeadId,
            Long linkedCustomerId,
            Long linkedDealId,
            Boolean checklistMustBeCompleted
    ) {}

    public record UpdateStatusRequest(
            @NotBlank String status
    ) {}

    public record TaskResponseDto(
            Long id,
            Long projectId,
            String projectName,
            String taskCode,
            String title,
            String description,
            String type,
            String priority,
            String status,
            Long assigneeId,
            String assigneeName,
            String assigneeTeam,
            String assigneeIds,
            String assigneeNames,
            Long reporterId,
            String reporterName,
            LocalDate dueDate,
            BigDecimal estimatedHours,
            String labels,
            Long linkedLeadId,
            String linkedLeadName,
            Long linkedCustomerId,
            String linkedCustomerName,
            Long linkedDealId,
            String linkedDealTitle,
            Boolean checklistMustBeCompleted,
            Long totalLoggedSeconds,
            Integer checklistTotal,
            Integer checklistCompleted,
            Boolean isTimerRunning
    ) {}
}
