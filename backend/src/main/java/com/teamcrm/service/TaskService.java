package com.teamcrm.service;

import com.teamcrm.dto.ChecklistDtos.*;
import com.teamcrm.dto.TaskDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import com.teamcrm.security.UserDetailsImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final LeadRepository leadRepository;
    private final CustomerRepository customerRepository;
    private final DealRepository dealRepository;
    private final TaskChecklistItemRepository checklistRepository;
    private final TaskTimeLogRepository timeLogRepository;
    private final AuditLogRepository auditLogRepository;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       UserRepository userRepository,
                       LeadRepository leadRepository,
                       CustomerRepository customerRepository,
                       DealRepository dealRepository,
                       TaskChecklistItemRepository checklistRepository,
                       TaskTimeLogRepository timeLogRepository,
                       AuditLogRepository auditLogRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.leadRepository = leadRepository;
        this.customerRepository = customerRepository;
        this.dealRepository = dealRepository;
        this.checklistRepository = checklistRepository;
        this.timeLogRepository = timeLogRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDto> getTasks(Long projectId, Long assigneeId, String status, String priority) {
        return getTasks(projectId, assigneeId, status, priority, null);
    }

    @Transactional(readOnly = true)
    public List<TaskResponseDto> getTasks(Long projectId, Long assigneeId, String status, String priority, UserDetailsImpl currentUser) {
        List<Task> tasks = taskRepository.findFilteredTasks(projectId, assigneeId, status, priority);
        if (currentUser != null && currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"))) {
            Long empId = currentUser.getId();
            tasks = tasks.stream().filter(t -> isTaskAssignedToUser(t, empId)).collect(Collectors.toList());
        }
        return tasks.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public boolean isTaskAssignedToUser(Task t, Long userId) {
        if (userId == null) return false;
        if (t.getAssignee() != null && userId.equals(t.getAssignee().getId())) {
            return true;
        }
        if (t.getAssigneeIds() != null) {
            String ids = t.getAssigneeIds().trim();
            if ("ALL".equalsIgnoreCase(ids)) return true;
            String[] parts = ids.split(",");
            for (String part : parts) {
                if (part.trim().equals(userId.toString())) return true;
            }
        }
        return false;
    }

    private void applyAssignees(Task task, String assigneeIds, Long singleAssigneeId) {
        if (assigneeIds != null && !assigneeIds.trim().isEmpty()) {
            String trimmed = assigneeIds.trim();
            task.setAssigneeIds(trimmed);
            if ("ALL".equalsIgnoreCase(trimmed)) {
                task.setAssigneeNames("All Employees");
                task.setAssignee(null);
            } else {
                List<Long> idList = java.util.Arrays.stream(trimmed.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .map(Long::parseLong)
                        .collect(Collectors.toList());
                List<User> users = userRepository.findAllById(idList);
                String names = users.stream().map(User::getFullName).collect(Collectors.joining(", "));
                task.setAssigneeNames(names);
                if (!users.isEmpty()) {
                    task.setAssignee(users.get(0));
                } else {
                    task.setAssignee(null);
                }
            }
        } else if (singleAssigneeId != null) {
            userRepository.findById(singleAssigneeId).ifPresent(u -> {
                task.setAssignee(u);
                task.setAssigneeIds(u.getId().toString());
                task.setAssigneeNames(u.getFullName());
            });
        } else if (assigneeIds != null && assigneeIds.trim().isEmpty()) {
            task.setAssignee(null);
            task.setAssigneeIds(null);
            task.setAssigneeNames(null);
        }
    }

    @Transactional(readOnly = true)
    public TaskResponseDto getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + id));
        return mapToDto(task);
    }

    @Transactional
    public TaskResponseDto createTask(CreateTaskRequest request, Long reporterId) {
        Project project = projectRepository.findById(request.projectId() != null ? request.projectId() : 1L)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        long nextNum = taskRepository.count() + 101;
        String taskCode = project.getKeyCode() + "-" + nextNum;

        Task task = new Task();
        task.setProject(project);
        task.setTaskCode(taskCode);
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setType(request.type() != null ? request.type() : "FEATURE");
        task.setPriority(request.priority() != null ? request.priority() : "MEDIUM");
        task.setStatus("TODO");
        task.setDueDate(request.dueDate());
        task.setEstimatedHours(request.estimatedHours());
        task.setLabels(request.labels());
        task.setChecklistMustBeCompleted(Boolean.TRUE.equals(request.checklistMustBeCompleted()));

        if (reporterId != null) {
            userRepository.findById(reporterId).ifPresent(task::setReporter);
        }
        applyAssignees(task, request.assigneeIds(), request.assigneeId());

        if (request.linkedLeadId() != null) {
            leadRepository.findById(request.linkedLeadId()).ifPresent(task::setLinkedLead);
        }
        if (request.linkedCustomerId() != null) {
            customerRepository.findById(request.linkedCustomerId()).ifPresent(task::setLinkedCustomer);
        }
        if (request.linkedDealId() != null) {
            dealRepository.findById(request.linkedDealId()).ifPresent(task::setLinkedDeal);
        }

        Task saved = taskRepository.save(task);

        auditLogRepository.save(new AuditLog(
                reporterId, null, "TASK_CREATE", "TASK",
                saved.getId().toString(), null, "Created task " + saved.getTaskCode()
        ));

        return mapToDto(saved);
    }

    @Transactional
    public TaskResponseDto updateTaskStatus(Long taskId, String newStatus, Long actorId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // When approving to DONE, automatically complete any remaining checklist items
        if ("DONE".equalsIgnoreCase(newStatus)) {
            checklistRepository.findByTaskIdOrderByPositionAsc(taskId).forEach(item -> {
                if (!Boolean.TRUE.equals(item.getIsDone())) {
                    item.setIsDone(true);
                    checklistRepository.save(item);
                }
            });
        }

        String oldStatus = task.getStatus();
        task.setStatus(newStatus.toUpperCase());
        task.setUpdatedAt(Instant.now());
        Task updated = taskRepository.save(task);

        auditLogRepository.save(new AuditLog(
                actorId, null, "TASK_STATUS_CHANGE", "TASK",
                task.getId().toString(), oldStatus, newStatus
        ));

        return mapToDto(updated);
    }

    @Transactional
    public TaskResponseDto updateTask(Long taskId, UpdateTaskRequest request, Long actorId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (request.title() != null) task.setTitle(request.title());
        if (request.description() != null) task.setDescription(request.description());
        if (request.type() != null) task.setType(request.type());
        if (request.priority() != null) task.setPriority(request.priority());
        if (request.dueDate() != null) task.setDueDate(request.dueDate());
        if (request.estimatedHours() != null) task.setEstimatedHours(request.estimatedHours());
        if (request.labels() != null) task.setLabels(request.labels());
        if (request.checklistMustBeCompleted() != null) task.setChecklistMustBeCompleted(request.checklistMustBeCompleted());

        if (request.assigneeIds() != null || request.assigneeId() != null) {
            applyAssignees(task, request.assigneeIds(), request.assigneeId());
        }
        if (request.linkedLeadId() != null) {
            leadRepository.findById(request.linkedLeadId()).ifPresent(task::setLinkedLead);
        }

        task.setUpdatedAt(Instant.now());
        Task updated = taskRepository.save(task);

        auditLogRepository.save(new AuditLog(
                actorId, null, "TASK_EDIT", "TASK",
                task.getId().toString(), null, "Updated details for " + task.getTaskCode()
        ));

        return mapToDto(updated);
    }

    @Transactional
    public void deleteTask(Long taskId, Long actorId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found with id " + taskId));

        task.setIsDeleted(true);
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);

        auditLogRepository.save(new AuditLog(
                actorId, null, "TASK_DELETE", "TASK",
                task.getId().toString(), null, "Deleted task " + task.getTaskCode() + " (" + task.getTitle() + ")"
        ));
    }

    // Checklist Management
    public List<ChecklistItemResponse> getTaskChecklist(Long taskId) {
        return checklistRepository.findByTaskIdOrderByPositionAsc(taskId).stream().map(c ->
                new ChecklistItemResponse(
                        c.getId(), c.getTask().getId(), c.getText(), c.getIsDone(),
                        c.getPosition(),
                        c.getDoneBy() != null ? c.getDoneBy().getId() : null,
                        c.getDoneBy() != null ? c.getDoneBy().getFullName() : null,
                        c.getDoneAt()
                )
        ).collect(Collectors.toList());
    }

    @Transactional
    public ChecklistItemResponse addChecklistItem(Long taskId, ChecklistItemRequest req) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        int nextPos = (int) checklistRepository.countByTaskId(taskId) + 1;
        TaskChecklistItem item = new TaskChecklistItem();
        item.setTask(task);
        item.setText(req.text());
        item.setIsDone(false);
        item.setPosition(req.position() != null ? req.position() : nextPos);

        TaskChecklistItem saved = checklistRepository.save(item);
        return new ChecklistItemResponse(
                saved.getId(), saved.getTask().getId(), saved.getText(),
                saved.getIsDone(), saved.getPosition(), null, null, null
        );
    }

    @Transactional
    public ChecklistItemResponse toggleChecklistItem(Long itemId, Long userId) {
        TaskChecklistItem item = checklistRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Checklist item not found"));

        boolean newState = !item.getIsDone();
        item.setIsDone(newState);
        if (newState) {
            userRepository.findById(userId).ifPresent(item::setDoneBy);
            item.setDoneAt(Instant.now());
        } else {
            item.setDoneBy(null);
            item.setDoneAt(null);
        }
        TaskChecklistItem saved = checklistRepository.save(item);

        return new ChecklistItemResponse(
                saved.getId(), saved.getTask().getId(), saved.getText(),
                saved.getIsDone(), saved.getPosition(),
                saved.getDoneBy() != null ? saved.getDoneBy().getId() : null,
                saved.getDoneBy() != null ? saved.getDoneBy().getFullName() : null,
                saved.getDoneAt()
        );
    }

    @Transactional
    public void deleteChecklistItem(Long itemId) {
        checklistRepository.deleteById(itemId);
    }

    public TaskResponseDto mapToDto(Task t) {
        Long totalLogged = timeLogRepository.getTotalDurationSecondsByTaskId(t.getId());
        long totalItems = checklistRepository.countByTaskId(t.getId());
        long pendingItems = checklistRepository.countByTaskIdAndIsDoneFalse(t.getId());

        // Check if any active timer exists for this task
        boolean hasRunningTimer = timeLogRepository.findByTaskIdOrderByStartTimeDesc(t.getId())
                .stream().anyMatch(l -> l.getEndTime() == null);

        return new TaskResponseDto(
                t.getId(),
                t.getProject() != null ? t.getProject().getId() : null,
                t.getProject() != null ? t.getProject().getName() : null,
                t.getTaskCode(),
                t.getTitle(),
                t.getDescription(),
                t.getType(),
                t.getPriority(),
                t.getStatus(),
                t.getAssignee() != null ? t.getAssignee().getId() : null,
                t.getAssignee() != null ? t.getAssignee().getFullName() : (t.getAssigneeNames() != null ? t.getAssigneeNames() : null),
                t.getAssignee() != null ? t.getAssignee().getTeamTag() : null,
                t.getAssigneeIds(),
                t.getAssigneeNames() != null ? t.getAssigneeNames() : (t.getAssignee() != null ? t.getAssignee().getFullName() : null),
                t.getReporter() != null ? t.getReporter().getId() : null,
                t.getReporter() != null ? t.getReporter().getFullName() : null,
                t.getDueDate(),
                t.getEstimatedHours(),
                t.getLabels(),
                t.getLinkedLead() != null ? t.getLinkedLead().getId() : null,
                t.getLinkedLead() != null ? (t.getLinkedLead().getFirstName() + " " + (t.getLinkedLead().getLastName() != null ? t.getLinkedLead().getLastName() : "")) : null,
                t.getLinkedCustomer() != null ? t.getLinkedCustomer().getId() : null,
                t.getLinkedCustomer() != null ? t.getLinkedCustomer().getCompanyName() : null,
                t.getLinkedDeal() != null ? t.getLinkedDeal().getId() : null,
                t.getLinkedDeal() != null ? t.getLinkedDeal().getTitle() : null,
                t.getChecklistMustBeCompleted(),
                totalLogged != null ? totalLogged : 0L,
                (int) totalItems,
                (int) (totalItems - pendingItems),
                hasRunningTimer
        );
    }
}
