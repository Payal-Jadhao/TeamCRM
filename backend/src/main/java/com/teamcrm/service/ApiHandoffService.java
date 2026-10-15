package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApiHandoffService {

    private final ApiDocRepository apiDocRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    public ApiHandoffService(ApiDocRepository apiDocRepository,
                             TaskRepository taskRepository,
                             UserRepository userRepository,
                             NotificationRepository notificationRepository,
                             AuditLogRepository auditLogRepository) {
        this.apiDocRepository = apiDocRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<ApiDocResponseDto> getAllApiDocs() {
        return apiDocRepository.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream().map(this::mapToDto).collect(Collectors.toList());
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
            taskRepository.findById(req.taskId()).ifPresent(doc::setTask);
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

        ApiDoc saved = apiDocRepository.save(doc);

        auditLogRepository.save(new AuditLog(
                creatorId, null, "API_DOC_PUBLISH", "API_DOC",
                saved.getId().toString(), null, "Published API: " + saved.getHttpMethod() + " " + saved.getEndpoint()
        ));

        return mapToDto(saved);
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

        // Notify frontend team when marked READY_FOR_INTEGRATION
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

    private ApiDocResponseDto mapToDto(ApiDoc d) {
        return new ApiDocResponseDto(
                d.getId(),
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
                d.getCreatedAt(),
                d.getUpdatedAt()
        );
    }
}
