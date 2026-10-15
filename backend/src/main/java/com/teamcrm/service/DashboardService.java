package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.dto.TimeTrackingDtos.RunningTimerDto;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TaskCommentRepository commentRepository;
    private final DealRepository dealRepository;
    private final LeadRepository leadRepository;
    private final UserRepository userRepository;
    private final TaskTimeLogRepository timeLogRepository;
    private final NotificationRepository notificationRepository;
    private final MeetingService meetingService;
    private final TimeTrackingService timeTrackingService;
    private final TaskService taskService;
    private final AuditLogRepository auditLogRepository;

    public DashboardService(ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            TaskCommentRepository commentRepository,
                            DealRepository dealRepository,
                            LeadRepository leadRepository,
                            UserRepository userRepository,
                            TaskTimeLogRepository timeLogRepository,
                            NotificationRepository notificationRepository,
                            MeetingService meetingService,
                            TimeTrackingService timeTrackingService,
                            TaskService taskService,
                            AuditLogRepository auditLogRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.dealRepository = dealRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.timeLogRepository = timeLogRepository;
        this.notificationRepository = notificationRepository;
        this.meetingService = meetingService;
        this.timeTrackingService = timeTrackingService;
        this.taskService = taskService;
        this.auditLogRepository = auditLogRepository;
    }

    public ManagerDashboardDto getManagerDashboard() {
        long totalProjects = projectRepository.count();
        List<Task> allTasks = taskRepository.findByIsDeletedFalse();
        long totalTasks = allTasks.size();
        long inProgressTasks = allTasks.stream().filter(t -> "IN_PROGRESS".equalsIgnoreCase(t.getStatus())).count();
        long blockedTasks = allTasks.stream().filter(t -> "BLOCKED".equalsIgnoreCase(t.getStatus())).count();

        long openQueries = commentRepository.findAll().stream()
                .filter(c -> "QUERY".equalsIgnoreCase(c.getType()) && "OPEN".equalsIgnoreCase(c.getStatus()))
                .count();

        List<Deal> deals = dealRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
        BigDecimal totalPipeline = deals.stream()
                .filter(d -> !"LOST".equalsIgnoreCase(d.getStage()))
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long wonCount = deals.stream().filter(d -> "WON".equalsIgnoreCase(d.getStage())).count();
        long totalLeads = leadRepository.count();

        // Team Workload
        Map<String, Long> workloadMap = allTasks.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignee().getFullName(), Collectors.counting()));

        List<Map<String, Object>> workloadList = workloadMap.entrySet().stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", e.getKey());
            item.put("tasks", e.getValue());
            return item;
        }).collect(Collectors.toList());

        // Deals By Stage
        Map<String, Long> dealsByStageMap = deals.stream()
                .collect(Collectors.groupingBy(Deal::getStage, Collectors.counting()));
        List<Map<String, Object>> dealsByStageList = dealsByStageMap.entrySet().stream().map(e -> {
            Map<String, Object> item = new HashMap<>();
            item.put("stage", e.getKey());
            item.put("count", e.getValue());
            return item;
        }).collect(Collectors.toList());

        // Recent Audit logs
        List<Map<String, Object>> recentActivity = auditLogRepository.findTop100ByOrderByCreatedAtDesc()
                .stream().limit(10).map(a -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", a.getId());
                    item.put("action", a.getAction());
                    item.put("entityName", a.getEntityName());
                    item.put("actorEmail", a.getActorEmail());
                    item.put("newValue", a.getNewValue());
                    item.put("createdAt", a.getCreatedAt());
                    return item;
                }).collect(Collectors.toList());

        return new ManagerDashboardDto(
                totalProjects, totalTasks, inProgressTasks, blockedTasks,
                openQueries, totalPipeline, wonCount, totalLeads,
                workloadList, dealsByStageList, recentActivity
        );
    }

    public EmployeeDashboardDto getEmployeeDashboard(Long userId) {
        List<Task> allActive = taskRepository.findByIsDeletedFalse();
        List<Task> myTasks = allActive.stream()
                .filter(t -> taskService.isTaskAssignedToUser(t, userId))
                .collect(Collectors.toList());
        long pendingCount = myTasks.stream().filter(t -> !"DONE".equalsIgnoreCase(t.getStatus())).count();
        long doneCount = myTasks.stream().filter(t -> "DONE".equalsIgnoreCase(t.getStatus())).count();

        Long totalLogged = timeLogRepository.findByUserIdOrderByStartTimeDesc(userId).stream()
                .mapToLong(TaskTimeLog::getDurationSeconds).sum();

        long unreadNotifs = notificationRepository.countByRecipientIdAndIsReadFalse(userId);

        RunningTimerDto activeTimer = timeTrackingService.getActiveTimerForUser(userId);

        var taskDtos = taskRepository.findByIsDeletedFalse().stream()
                .filter(t -> taskService.isTaskAssignedToUser(t, userId))
                .map(taskService::mapToDto)
                .collect(Collectors.toList());
        var upcomingMeetings = meetingService.getUserMeetings(userId);

        return new EmployeeDashboardDto(
                pendingCount, doneCount, totalLogged, unreadNotifs,
                taskDtos, activeTimer, upcomingMeetings
        );
    }
}
