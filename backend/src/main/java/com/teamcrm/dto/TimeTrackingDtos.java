package com.teamcrm.dto;

import java.time.Instant;

public class TimeTrackingDtos {

    public record StartTimerRequest(
            Long taskId,
            String note
    ) {}

    public record StopTimerRequest(
            String note
    ) {}

    public record ManualTimeLogRequest(
            Long taskId,
            Long userId,
            Instant startTime,
            Instant endTime,
            Long durationSeconds,
            String note
    ) {}

    public record TimeLogResponseDto(
            Long id,
            Long taskId,
            String taskCode,
            String taskTitle,
            Long userId,
            String userName,
            Instant startTime,
            Instant endTime,
            Long durationSeconds,
            String note,
            String source
    ) {}

    public record RunningTimerDto(
            Long logId,
            Long taskId,
            String taskCode,
            String taskTitle,
            Instant startTime,
            Long elapsedSeconds,
            String note
    ) {}

    public record TaskTimeSummaryDto(
            Long taskId,
            Long totalSeconds,
            Double estimatedHours,
            Double actualHours,
            Double varianceHours,
            Boolean isRunning
    ) {}
}
