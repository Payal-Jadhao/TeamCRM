package com.teamcrm.dto;

import java.time.Instant;

public class TimeTrackingDtos {

    public record StartTimerRequest(
            Long taskId,
            String note
    ) {}

    public record StopTimerRequest(
            Long taskId,
            String note
    ) {
        public StopTimerRequest(String note) {
            this(null, note);
        }
    }

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
            String note,
            Long accumulatedSeconds
    ) {
        public RunningTimerDto(Long logId, Long taskId, String taskCode, String taskTitle, Instant startTime, Long elapsedSeconds, String note) {
            this(logId, taskId, taskCode, taskTitle, startTime, elapsedSeconds, note, 0L);
        }
    }

    public record TaskTimeSummaryDto(
            Long taskId,
            Long totalSeconds,
            Double estimatedHours,
            Double actualHours,
            Double varianceHours,
            Boolean isRunning
    ) {}
}
