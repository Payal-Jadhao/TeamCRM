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
     * Start or resume a timer for the given user on the specified task.
     * Business Rule: Timers are tracked independently per task.
     * When a timer for a specific task is paused and resumed, it appends to that
     * task's existing accumulated time instead of creating a brand new disconnected timer.
     * Other tasks maintain their own separate timers based on server-side time.
     */
    @Transactional
    public RunningTimerDto startTimer(Long taskId, Long userId, String note) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Check if an active timer is already running for this user on this task
        Optional<TaskTimeLog> runningOpt = timeLogRepository.findActiveLogByUserIdAndTaskId(userId, taskId);
        if (runningOpt.isPresent()) {
            TaskTimeLog log = runningOpt.get();
            long sessionElapsed = Math.max(0L, Duration.between(log.getStartTime(), Instant.now()).getSeconds());
            long accumulated = log.getDurationSeconds() != null ? log.getDurationSeconds() : 0L;
            return new RunningTimerDto(
                    log.getId(),
                    task.getId(),
                    task.getTaskCode(),
                    task.getTitle(),
                    log.getStartTime(),
                    accumulated + sessionElapsed,
                    log.getNote(),
                    accumulated
            );
        }

        // Check if there is an existing (paused) TIMER log for this task and user to resume
        Optional<TaskTimeLog> existingPausedLog = timeLogRepository
                .findFirstByTaskIdAndUserIdAndSourceOrderByUpdatedAtDesc(taskId, userId, "TIMER");

        Instant now = Instant.now();
        TaskTimeLog logToSave;
        long accumulatedSeconds = 0L;

        if (existingPausedLog.isPresent()) {
            // Resume existing timer: preserve existing durationSeconds as base accumulated time
            logToSave = existingPausedLog.get();
            accumulatedSeconds = logToSave.getDurationSeconds() != null ? logToSave.getDurationSeconds() : 0L;
            logToSave.setStartTime(now);
            logToSave.setEndTime(null);
            if (note != null && !note.isBlank()) {
                logToSave.setNote(note);
            }
            logToSave.setUpdatedAt(now);
        } else {
            // First time timer on this task for this user
            logToSave = new TaskTimeLog();
            logToSave.setTask(task);
            logToSave.setUser(user);
            logToSave.setStartTime(now);
            logToSave.setDurationSeconds(0L);
            logToSave.setSource("TIMER");
            logToSave.setNote(note);
        }

        TaskTimeLog saved = timeLogRepository.save(logToSave);

        // Record firstStartedAt if not yet set
        boolean taskChanged = false;
        if (task.getFirstStartedAt() == null) {
            task.setFirstStartedAt(now);
            taskChanged = true;
        }

        // Move task status to IN_PROGRESS if currently TODO
        if ("TODO".equalsIgnoreCase(task.getStatus())) {
            task.setStatus("IN_PROGRESS");
            taskChanged = true;
        }

        if (taskChanged) {
            task.setUpdatedAt(now);
            taskRepository.save(task);
        }

        return new RunningTimerDto(
                saved.getId(),
                task.getId(),
                task.getTaskCode(),
                task.getTitle(),
                saved.getStartTime(),
                accumulatedSeconds,
                saved.getNote(),
                accumulatedSeconds
        );
    }

    /**
     * Pause / Stop active timer for a specific task (or latest active timer if taskId is null).
     * Appends the elapsed session time to existing accumulated durationSeconds.
     */
    @Transactional
    public TimeLogResponseDto stopTimer(Long userId, Long taskId, String note) {
        Optional<TaskTimeLog> activeLogOpt;
        if (taskId != null) {
            activeLogOpt = timeLogRepository.findActiveLogByUserIdAndTaskId(userId, taskId);
        } else {
            List<TaskTimeLog> activeList = timeLogRepository.findActiveLogsByUserId(userId);
            activeLogOpt = activeList.isEmpty() ? Optional.empty() : Optional.of(activeList.get(0));
        }

        if (activeLogOpt.isEmpty()) {
            throw new IllegalStateException("No active timer found to pause/stop");
        }

        TaskTimeLog activeLog = activeLogOpt.get();
        Instant now = Instant.now();
        activeLog.setEndTime(now);
        long sessionSeconds = Math.max(0L, Duration.between(activeLog.getStartTime(), now).getSeconds());
        long prevAccumulated = activeLog.getDurationSeconds() != null ? activeLog.getDurationSeconds() : 0L;
        activeLog.setDurationSeconds(prevAccumulated + sessionSeconds);
        if (note != null && !note.isBlank()) {
            activeLog.setNote(note);
        }
        activeLog.setUpdatedAt(now);
        TaskTimeLog saved = timeLogRepository.save(activeLog);

        return mapToDto(saved);
    }

    @Transactional
    public TimeLogResponseDto stopTimer(Long userId, String note) {
        return stopTimer(userId, null, note);
    }

    /**
     * Get primary active timer for user (most recent active timer for topbar).
     */
    public RunningTimerDto getActiveTimerForUser(Long userId) {
        List<TaskTimeLog> activeList = timeLogRepository.findActiveLogsByUserId(userId);
        if (activeList.isEmpty()) {
            return null;
        }

        TaskTimeLog log = activeList.get(0);
        long sessionElapsed = Math.max(0L, Duration.between(log.getStartTime(), Instant.now()).getSeconds());
        long accumulated = log.getDurationSeconds() != null ? log.getDurationSeconds() : 0L;
        return new RunningTimerDto(
                log.getId(),
                log.getTask().getId(),
                log.getTask().getTaskCode(),
                log.getTask().getTitle(),
                log.getStartTime(),
                accumulated + sessionElapsed,
                log.getNote(),
                accumulated
        );
    }

    /**
     * Get active timer for a specific task.
     */
    public RunningTimerDto getActiveTimerForTask(Long taskId, Long userId) {
        Optional<TaskTimeLog> logOpt = timeLogRepository.findActiveLogByUserIdAndTaskId(userId, taskId);
        if (logOpt.isEmpty()) {
            return null;
        }
        TaskTimeLog log = logOpt.get();
        long sessionElapsed = Math.max(0L, Duration.between(log.getStartTime(), Instant.now()).getSeconds());
        long accumulated = log.getDurationSeconds() != null ? log.getDurationSeconds() : 0L;
        return new RunningTimerDto(
                log.getId(),
                log.getTask().getId(),
                log.getTask().getTaskCode(),
                log.getTask().getTitle(),
                log.getStartTime(),
                accumulated + sessionElapsed,
                log.getNote(),
                accumulated
        );
    }

    /**
     * Get all active running timers for this user.
     */
    public List<RunningTimerDto> getAllActiveTimersForUser(Long userId) {
        List<TaskTimeLog> activeLogs = timeLogRepository.findActiveLogsByUserId(userId);
        Instant now = Instant.now();
        return activeLogs.stream().map(log -> {
            long sessionElapsed = Math.max(0L, Duration.between(log.getStartTime(), now).getSeconds());
            long accumulated = log.getDurationSeconds() != null ? log.getDurationSeconds() : 0L;
            return new RunningTimerDto(
                    log.getId(),
                    log.getTask().getId(),
                    log.getTask().getTaskCode(),
                    log.getTask().getTitle(),
                    log.getStartTime(),
                    accumulated + sessionElapsed,
                    log.getNote(),
                    accumulated
            );
        }).collect(Collectors.toList());
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
                long prevAccumulated = log.getDurationSeconds() != null ? log.getDurationSeconds() : 0L;
                log.setDurationSeconds(prevAccumulated + 36000L);
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
