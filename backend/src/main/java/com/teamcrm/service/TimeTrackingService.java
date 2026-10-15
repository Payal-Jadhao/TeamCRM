package com.teamcrm.service;

import com.teamcrm.dto.TimeTrackingDtos.*;
import com.teamcrm.entity.AuditLog;
import com.teamcrm.entity.Task;
import com.teamcrm.entity.TaskTimeLog;
import com.teamcrm.entity.User;
import com.teamcrm.repository.AuditLogRepository;
import com.teamcrm.repository.TaskRepository;
import com.teamcrm.repository.TaskTimeLogRepository;
import com.teamcrm.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TimeTrackingService {

    private final TaskTimeLogRepository timeLogRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    public TimeTrackingService(TaskTimeLogRepository timeLogRepository,
                               TaskRepository taskRepository,
                               UserRepository userRepository,
                               AuditLogRepository auditLogRepository) {
        this.timeLogRepository = timeLogRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Start a new timer for the given user on the specified task.
     * Business Rule: A user can have only ONE active timer. If an existing timer is active,
     * it is automatically paused/stopped before starting the new one.
     */
    @Transactional
    public RunningTimerDto startTimer(Long taskId, Long userId, String note) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // 1. Auto-pause existing active timer if any
        Optional<TaskTimeLog> activeLogOpt = timeLogRepository.findActiveLogByUserId(userId);
        if (activeLogOpt.isPresent()) {
            TaskTimeLog existingLog = activeLogOpt.get();
            Instant now = Instant.now();
            existingLog.setEndTime(now);
            long seconds = Duration.between(existingLog.getStartTime(), now).getSeconds();
            existingLog.setDurationSeconds(Math.max(seconds, 1L));
            existingLog.setNote((existingLog.getNote() != null ? existingLog.getNote() + " | " : "") + "Auto-paused by starting new timer");
            timeLogRepository.save(existingLog);
        }

        // 2. Start new timer session
        Instant startTime = Instant.now();
        TaskTimeLog newLog = new TaskTimeLog();
        newLog.setTask(task);
        newLog.setUser(user);
        newLog.setStartTime(startTime);
        newLog.setDurationSeconds(0L);
        newLog.setSource("TIMER");
        newLog.setNote(note);
        TaskTimeLog saved = timeLogRepository.save(newLog);

        // 3. Move task status to IN_PROGRESS if currently TODO
        if ("TODO".equalsIgnoreCase(task.getStatus())) {
            task.setStatus("IN_PROGRESS");
            task.setUpdatedAt(Instant.now());
            taskRepository.save(task);
        }

        return new RunningTimerDto(
                saved.getId(),
                task.getId(),
                task.getTaskCode(),
                task.getTitle(),
                saved.getStartTime(),
                0L,
                saved.getNote()
        );
    }

    /**
     * Pause / Stop active timer for the user.
     */
    @Transactional
    public TimeLogResponseDto stopTimer(Long userId, String note) {
        TaskTimeLog activeLog = timeLogRepository.findActiveLogByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No active timer found to pause/stop"));

        Instant now = Instant.now();
        activeLog.setEndTime(now);
        long seconds = Duration.between(activeLog.getStartTime(), now).getSeconds();
        activeLog.setDurationSeconds(Math.max(seconds, 1L));
        if (note != null && !note.isBlank()) {
            activeLog.setNote(note);
        }
        activeLog.setUpdatedAt(now);
        TaskTimeLog saved = timeLogRepository.save(activeLog);

        return mapToDto(saved);
    }

    /**
     * Get currently running timer for topbar live calculation.
     */
    public RunningTimerDto getActiveTimerForUser(Long userId) {
        Optional<TaskTimeLog> activeLogOpt = timeLogRepository.findActiveLogByUserId(userId);
        if (activeLogOpt.isEmpty()) {
            return null;
        }

        TaskTimeLog log = activeLogOpt.get();
        long elapsedSeconds = Duration.between(log.getStartTime(), Instant.now()).getSeconds();
        return new RunningTimerDto(
                log.getId(),
                log.getTask().getId(),
                log.getTask().getTaskCode(),
                log.getTask().getTitle(),
                log.getStartTime(),
                Math.max(elapsedSeconds, 0L),
                log.getNote()
        );
    }

    public List<TimeLogResponseDto> getTaskTimeLogs(Long taskId) {
        return timeLogRepository.findByTaskIdOrderByStartTimeDesc(taskId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public List<TimeLogResponseDto> getUserTimeLogs(Long userId) {
        return timeLogRepository.findByUserIdOrderByStartTimeDesc(userId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public TimeLogResponseDto createManualTimeLog(ManualTimeLogRequest req, Long managerId) {
        Task task = taskRepository.findById(req.taskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User targetUser = userRepository.findById(req.userId() != null ? req.userId() : managerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskTimeLog log = new TaskTimeLog();
        log.setTask(task);
        log.setUser(targetUser);
        log.setStartTime(req.startTime() != null ? req.startTime() : Instant.now());
        log.setEndTime(req.endTime() != null ? req.endTime() : Instant.now());
        log.setDurationSeconds(req.durationSeconds() != null ? req.durationSeconds() : 0L);
        log.setSource("MANUAL");
        log.setNote(req.note());

        TaskTimeLog saved = timeLogRepository.save(log);

        auditLogRepository.save(new AuditLog(
                managerId, null, "TIME_EDIT_MANUAL", "TASK_TIME_LOG",
                saved.getId().toString(), null,
                "Manually logged " + (saved.getDurationSeconds() / 60) + " mins for " + targetUser.getEmail()
        ));

        return mapToDto(saved);
    }

    /**
     * Scheduled job to automatically stop timers exceeding 10 hours (36000 seconds).
     * Runs every 30 minutes.
     */
    @Scheduled(fixedRate = 1800000)
    @Transactional
    public void autoStopExcessiveTimers() {
        List<TaskTimeLog> activeLogs = timeLogRepository.findAllActiveLogs();
        Instant now = Instant.now();
        for (TaskTimeLog log : activeLogs) {
            long seconds = Duration.between(log.getStartTime(), now).getSeconds();
            if (seconds > 36000) { // 10 hours
                log.setEndTime(now);
                log.setDurationSeconds(36000L);
                log.setSource("AUTO_STOPPED");
                log.setNote("Auto-stopped after 10 hours of inactivity");
                timeLogRepository.save(log);

                auditLogRepository.save(new AuditLog(
                        null, "system@teamcrm.com", "AUTO_STOP_TIMER", "TASK_TIME_LOG",
                        log.getId().toString(), null, "Auto-stopped 10h timer for user " + log.getUser().getId()
                ));
            }
        }
    }

    private TimeLogResponseDto mapToDto(TaskTimeLog l) {
        return new TimeLogResponseDto(
                l.getId(),
                l.getTask().getId(),
                l.getTask().getTaskCode(),
                l.getTask().getTitle(),
                l.getUser().getId(),
                l.getUser().getFullName(),
                l.getStartTime(),
                l.getEndTime(),
                l.getDurationSeconds(),
                l.getNote(),
                l.getSource()
        );
    }
}
