package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ApiHandoffService {

    private final ApiDocRepository apiDocRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final ApiDocCommentRepository apiDocCommentRepository;

    public ApiHandoffService(ApiDocRepository apiDocRepository,
                             ProjectRepository projectRepository,
                             TaskRepository taskRepository,
                             UserRepository userRepository,
                             NotificationRepository notificationRepository,
                             AuditLogRepository auditLogRepository,
                             ApiDocCommentRepository apiDocCommentRepository) {
        this.apiDocRepository = apiDocRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.apiDocCommentRepository = apiDocCommentRepository;
    }

    public List<ApiDocResponseDto> getAllApiDocs(Long currentUserId, boolean isAdmin) {
        List<ApiDoc> allDocs = apiDocRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
        if (isAdmin) {
            return allDocs.stream().map(this::mapToDto).collect(Collectors.toList());
        }

        return allDocs.stream()
                .filter(d -> isDocVisibleToUser(d, currentUserId))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private boolean isDocVisibleToUser(ApiDoc d, Long userId) {
        // Independent API Handoff (not tied to any specific project or task) is visible to ALL
        boolean isIndependent = (d.getProject() == null && d.getTask() == null);
        if (isIndependent) {
            return true;
        }

        // Project-specific API Handoff: visible to creator, tagged members, and members of that specific project
        if (d.getCreatedBy() != null && d.getCreatedBy().getId().equals(userId)) {
            return true;
        }

        if (d.getTaggedUsers() != null && d.getTaggedUsers().stream().anyMatch(u -> u.getId().equals(userId))) {
            return true;
        }

        Project p = d.getProject() != null ? d.getProject() : (d.getTask() != null ? d.getTask().getProject() : null);
        if (p != null) {
            if (p.getOwner() != null && p.getOwner().getId().equals(userId)) {
                return true;
            }
            if (p.getMembers() != null && p.getMembers().stream().anyMatch(m -> m.getId().equals(userId))) {
                return true;
            }
        }

        if (d.getTask() != null && d.getTask().getAssignee() != null && d.getTask().getAssignee().getId().equals(userId)) {
            return true;
        }

        return false;
    }

    public List<ApiDocResponseDto> getApiDocsByTaskId(Long taskId) {
        return apiDocRepository.findByTaskIdAndIsDeletedFalse(taskId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public ApiDocResponseDto createApiDoc(CreateApiDocRequest req, Long creatorId) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ApiDoc doc = new ApiDoc();
        if (req.taskId() != null) {
            taskRepository.findById(req.taskId()).ifPresent(t -> {
                doc.setTask(t);
                if (t.getProject() != null) {
                    doc.setProject(t.getProject());
                }
            });
        } else if (req.projectId() != null) {
            projectRepository.findById(req.projectId()).ifPresent(doc::setProject);
        }

        doc.setTitle(req.title());
        doc.setHttpMethod(req.httpMethod() != null ? req.httpMethod().toUpperCase() : "GET");
        doc.setEndpoint(req.endpoint());
        doc.setStatus(req.status() != null ? req.status() : "DRAFT");
        doc.setVersion(req.version() != null ? req.version() : "v1.0.0");
        doc.setEnvironment(req.environment() != null ? req.environment() : "DEV");
        doc.setAuthRequired(req.authRequired());
        doc.setErrorCodes(req.errorCodes());
        doc.setSwaggerUrl(req.swaggerUrl());
        doc.setPostmanUrl(req.postmanUrl());
        doc.setRequestBodyJson(req.requestBodyJson());
        doc.setResponseBodyJson(req.responseBodyJson());
        doc.setChangeNotes(req.changeNotes());
        doc.setCreatedBy(creator);

        if (req.taggedUserIds() != null && !req.taggedUserIds().isEmpty()) {
            Set<User> tagged = new HashSet<>(userRepository.findAllById(req.taggedUserIds()));
            doc.setTaggedUsers(tagged);
        }

        ApiDoc saved = apiDocRepository.save(doc);

        auditLogRepository.save(new AuditLog(
                creatorId, null, "API_DOC_PUBLISH", "API_DOC",
                saved.getId().toString(), null, "Published API: " + saved.getHttpMethod() + " " + saved.getEndpoint()
        ));

        return mapToDto(saved);
    }

    @Transactional
    public ApiDocResponseDto updateApiDoc(Long docId, UpdateApiDocRequest req, Long currentUserId, boolean isAdmin) {
        ApiDoc doc = apiDocRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("API specification not found"));

        // Permission check: Admin can edit any; Manager & Employee can only edit their own
        boolean isAuthor = doc.getCreatedBy() != null && doc.getCreatedBy().getId().equals(currentUserId);
        if (!isAdmin && !isAuthor) {
            throw new AccessDeniedException("You are only permitted to edit your own published API specifications.");
        }

        if (req.title() != null) doc.setTitle(req.title());
        if (req.httpMethod() != null) doc.setHttpMethod(req.httpMethod().toUpperCase());
        if (req.endpoint() != null) doc.setEndpoint(req.endpoint());
        if (req.status() != null) doc.setStatus(req.status());
        if (req.version() != null) doc.setVersion(req.version());
        if (req.environment() != null) doc.setEnvironment(req.environment());
        if (req.authRequired() != null) doc.setAuthRequired(req.authRequired());
        if (req.errorCodes() != null) doc.setErrorCodes(req.errorCodes());
        if (req.swaggerUrl() != null) doc.setSwaggerUrl(req.swaggerUrl());
        if (req.postmanUrl() != null) doc.setPostmanUrl(req.postmanUrl());
        if (req.requestBodyJson() != null) doc.setRequestBodyJson(req.requestBodyJson());
        if (req.responseBodyJson() != null) doc.setResponseBodyJson(req.responseBodyJson());
        if (req.changeNotes() != null) doc.setChangeNotes(req.changeNotes());

        if (req.taskId() != null) {
            taskRepository.findById(req.taskId()).ifPresent(t -> {
                doc.setTask(t);
                if (t.getProject() != null) {
                    doc.setProject(t.getProject());
                }
            });
        } else {
            doc.setTask(null);
            if (req.projectId() != null) {
                projectRepository.findById(req.projectId()).ifPresent(doc::setProject);
            } else {
                doc.setProject(null);
            }
        }

        if (req.taggedUserIds() != null) {
            Set<User> tagged = new HashSet<>(userRepository.findAllById(req.taggedUserIds()));
            doc.setTaggedUsers(tagged);
        }

        doc.setUpdatedAt(Instant.now());
        ApiDoc updated = apiDocRepository.save(doc);

        auditLogRepository.save(new AuditLog(
                currentUserId, null, "API_DOC_UPDATE", "API_DOC",
                updated.getId().toString(), null, "Updated API: " + updated.getHttpMethod() + " " + updated.getEndpoint()
        ));

        return mapToDto(updated);
    }

    @Transactional
    public ApiDocResponseDto updateStatus(Long docId, UpdateApiDocStatusRequest req, Long actorId) {
        ApiDoc doc = apiDocRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("API doc not found"));

        String oldStatus = doc.getStatus();
        doc.setStatus(req.status().toUpperCase());
        if (req.notes() != null && !req.notes().isBlank()) {
            doc.setChangeNotes(req.notes());
        }
        doc.setUpdatedAt(Instant.now());
        ApiDoc updated = apiDocRepository.save(doc);

        if ("READY_FOR_INTEGRATION".equalsIgnoreCase(req.status())) {
            List<User> frontendUsers = userRepository.findByTeamTag("FRONTEND");
            User actor = userRepository.findById(actorId).orElse(null);
            for (User fe : frontendUsers) {
                Notification notif = new Notification();
                notif.setRecipient(fe);
                notif.setSender(actor);
                notif.setTitle("API Ready for Integration");
                notif.setMessage("Endpoint " + doc.getHttpMethod() + " " + doc.getEndpoint() + " is ready to integrate!");
                notif.setType("API_READY");
                notif.setReferenceType("API_DOC");
                notif.setReferenceId(doc.getId());
                notificationRepository.save(notif);
            }
        }

        auditLogRepository.save(new AuditLog(
                actorId, null, "API_STATUS_CHANGE", "API_DOC",
                doc.getId().toString(), oldStatus, req.status().toUpperCase()
        ));

        return mapToDto(updated);
    }

    @Transactional
    public ApiDocCommentDto addComment(Long docId, CreateApiDocCommentRequest req, Long currentUserId) {
        ApiDoc doc = apiDocRepository.findById(docId)
                .orElseThrow(() -> new RuntimeException("API doc not found"));

        User author = userRepository.findById(currentUserId).orElse(null);
        String authorName = (author != null && author.getFullName() != null) ? author.getFullName() : req.authorName();
        String authorRole = (author != null && author.getRole() != null) ? author.getRole().getName() : req.authorRole();

        ApiDocComment comment = new ApiDocComment(doc, author, authorName, authorRole, req.text());
        ApiDocComment saved = apiDocCommentRepository.save(comment);

        // Notify doc author and tagged members
        if (author != null) {
            Set<User> recipients = new HashSet<>();
            if (doc.getCreatedBy() != null && !doc.getCreatedBy().getId().equals(currentUserId)) {
                recipients.add(doc.getCreatedBy());
            }
            if (doc.getTaggedUsers() != null) {
                for (User u : doc.getTaggedUsers()) {
                    if (!u.getId().equals(currentUserId)) {
                        recipients.add(u);
                    }
                }
            }
            for (User r : recipients) {
                Notification notif = new Notification();
                notif.setRecipient(r);
                notif.setSender(author);
                notif.setTitle("New Query on API: " + doc.getEndpoint());
                notif.setMessage(authorName + ": " + (req.text().length() > 60 ? req.text().substring(0, 57) + "..." : req.text()));
                notif.setType("API_QUERY");
                notif.setReferenceType("API_DOC");
                notif.setReferenceId(doc.getId());
                notificationRepository.save(notif);
            }
        }

        return new ApiDocCommentDto(
                saved.getId(),
                doc.getId(),
                author != null ? author.getId() : null,
                saved.getAuthorName(),
                saved.getAuthorRole(),
                saved.getText(),
                saved.getCreatedAt()
        );
    }

    public List<ApiDocCommentDto> getComments(Long docId) {
        return apiDocCommentRepository.findByApiDocIdOrderByCreatedAtAsc(docId).stream()
                .map(c -> new ApiDocCommentDto(
                        c.getId(),
                        c.getApiDoc().getId(),
                        c.getAuthor() != null ? c.getAuthor().getId() : null,
                        c.getAuthorName(),
                        c.getAuthorRole(),
                        c.getText(),
                        c.getCreatedAt()
                ))
                .collect(Collectors.toList());
    }

    private ApiDocResponseDto mapToDto(ApiDoc d) {
        Project proj = d.getProject() != null ? d.getProject() : (d.getTask() != null ? d.getTask().getProject() : null);

        List<Long> taggedIds = d.getTaggedUsers() != null
                ? d.getTaggedUsers().stream().map(User::getId).collect(Collectors.toList())
                : Collections.emptyList();
        List<String> taggedNames = d.getTaggedUsers() != null
                ? d.getTaggedUsers().stream().map(User::getFullName).collect(Collectors.toList())
                : Collections.emptyList();
        List<String> taggedEmails = d.getTaggedUsers() != null
                ? d.getTaggedUsers().stream().map(User::getEmail).collect(Collectors.toList())
                : Collections.emptyList();

        List<ApiDocCommentDto> commentDtos = d.getComments() != null
                ? d.getComments().stream().map(c -> new ApiDocCommentDto(
                        c.getId(),
                        d.getId(),
                        c.getAuthor() != null ? c.getAuthor().getId() : null,
                        c.getAuthorName(),
                        c.getAuthorRole(),
                        c.getText(),
                        c.getCreatedAt()
                )).collect(Collectors.toList())
                : Collections.emptyList();

        return new ApiDocResponseDto(
                d.getId(),
                proj != null ? proj.getId() : null,
                proj != null ? proj.getName() : null,
                d.getTask() != null ? d.getTask().getId() : null,
                d.getTask() != null ? d.getTask().getTaskCode() : null,
                d.getTask() != null ? d.getTask().getTitle() : null,
                d.getTitle(),
                d.getHttpMethod(),
                d.getEndpoint(),
                d.getStatus(),
                d.getVersion(),
                d.getEnvironment(),
                d.getAuthRequired(),
                d.getErrorCodes(),
                d.getSwaggerUrl(),
                d.getPostmanUrl(),
                d.getRequestBodyJson(),
                d.getResponseBodyJson(),
                d.getChangeNotes(),
                d.getCreatedBy() != null ? d.getCreatedBy().getId() : null,
                d.getCreatedBy() != null ? d.getCreatedBy().getFullName() : null,
                taggedIds,
                taggedNames,
                taggedEmails,
                commentDtos,
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
