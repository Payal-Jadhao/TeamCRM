package com.teamcrm.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class OtherDtos {

    // Discussion / Comments
    public record CreateCommentRequest(
            Long taskId,
            String type, // QUERY, BLOCKER, UPDATE, GENERAL
            String body,
            Long parentId
    ) {}

    public record CommentResponseDto(
            Long id,
            Long taskId,
            Long authorId,
            String authorName,
            String authorTeam,
            String authorAvatar,
            String type,
            String body,
            Long parentId,
            String status,
            Instant createdAt
    ) {}

    // API Handoff
    public record CreateApiDocRequest(
            Long taskId,
            String title,
            String httpMethod,
            String endpoint,
            String status,
            String version,
            String environment,
            String authRequired,
            String errorCodes,
            String swaggerUrl,
            String postmanUrl,
            String requestBodyJson,
            String responseBodyJson,
            String changeNotes
    ) {}

    public record UpdateApiDocStatusRequest(
            String status,
            String notes
    ) {}

    public record ApiDocResponseDto(
            Long id,
            Long taskId,
            String taskCode,
            String taskTitle,
            String title,
            String httpMethod,
            String endpoint,
            String status,
            String version,
            String environment,
            String authRequired,
            String errorCodes,
            String swaggerUrl,
            String postmanUrl,
            String requestBodyJson,
            String responseBodyJson,
            String changeNotes,
            Long createdById,
            String createdByName,
            Instant createdAt,
            Instant updatedAt
    ) {}

    // Meetings
    public record CreateMeetingRequest(
            String title,
            String agenda,
            Instant startTime,
            Instant endTime,
            Integer durationMinutes,
            String meetingLink,
            String location,
            Long linkedTaskId,
            List<Long> attendeeIds
    ) {}

    public record MeetingResponseDto(
            Long id,
            String title,
            String agenda,
            Instant startTime,
            Instant endTime,
            Integer durationMinutes,
            String meetingLink,
            String location,
            String status,
            Long linkedTaskId,
            String linkedTaskTitle,
            Long organizerId,
            String organizerName,
            List<String> attendeeNames,
            String notes,
            String actionItemsJson,
            Instant createdAt
    ) {}

    // CRM Leads, Customers, Deals
    public record LeadRequestDto(
            String firstName,
            String lastName,
            String company,
            String email,
            String phone,
            String status,
            String source,
            String notes,
            Long assignedToId
    ) {}

    public record LeadResponseDto(
            Long id,
            String firstName,
            String lastName,
            String company,
            String email,
            String phone,
            String status,
            String source,
            String notes,
            Long assignedToId,
            String assignedToName,
            Instant createdAt
    ) {}

    public record CustomerRequestDto(
            String companyName,
            String industry,
            String website,
            String primaryContactName,
            String primaryContactEmail,
            String primaryContactPhone,
            String address,
            Long accountManagerId
    ) {}

    public record CustomerResponseDto(
            Long id,
            String companyName,
            String industry,
            String website,
            String primaryContactName,
            String primaryContactEmail,
            String primaryContactPhone,
            String address,
            Long accountManagerId,
            String accountManagerName,
            Instant createdAt
    ) {}

    public record DealRequestDto(
            String title,
            Long customerId,
            Long leadId,
            String stage,
            BigDecimal dealValue,
            String currency,
            LocalDate expectedCloseDate,
            Long assignedToId,
            String notes
    ) {}

    public record DealResponseDto(
            Long id,
            String title,
            Long customerId,
            String customerName,
            Long leadId,
            String leadName,
            String stage,
            BigDecimal dealValue,
            String currency,
            LocalDate expectedCloseDate,
            Long assignedToId,
            String assignedToName,
            String notes,
            Instant createdAt
    ) {}

    // Dashboards
    public record ManagerDashboardDto(
            long totalProjects,
            long totalTasks,
            long inProgressTasks,
            long blockedTasks,
            long openQueries,
            BigDecimal totalPipelineRevenue,
            long wonDealsCount,
            long totalLeads,
            List<Map<String, Object>> teamWorkload,
            List<Map<String, Object>> dealsByStage,
            List<Map<String, Object>> recentActivity
    ) {}

    public record EmployeeDashboardDto(
            long myPendingTasksCount,
            long myDoneTasksCount,
            long myTotalHoursLoggedSeconds,
            long unreadNotificationsCount,
            List<TaskDtos.TaskResponseDto> myActiveTasks,
            TimeTrackingDtos.RunningTimerDto activeTimer,
            List<MeetingResponseDto> upcomingMeetings
    ) {}

    // AI Assist
    public record AiPromptRequest(
            String prompt,
            String contextType, // CHECKLIST, LEAD_SUMMARY, DISCUSSION_SUMMARY, EMAIL_DRAFT, COPILOT_CHAT
            String content,
            String apiKey
    ) {
        public AiPromptRequest(String prompt, String contextType, String content) {
            this(prompt, contextType, content, null);
        }
    }

    public record AiResponseDto(
            String result,
            List<String> items
    ) {}
}
