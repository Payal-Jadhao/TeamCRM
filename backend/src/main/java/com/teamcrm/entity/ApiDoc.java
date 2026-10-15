package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "api_docs")
public class ApiDoc {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 10)
    private String httpMethod; // 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'

    @Column(nullable = false, length = 255)
    private String endpoint;

    @Column(nullable = false, length = 40)
    private String status = "DRAFT"; // 'DRAFT', 'READY_FOR_INTEGRATION', 'INTEGRATING', 'INTEGRATED', 'CHANGE_REQUESTED'

    @Column(nullable = false, length = 30)
    private String version = "v1.0.0";

    @Column(length = 30)
    private String environment = "DEV"; // 'DEV', 'STAGING', 'PROD'

    @Column(length = 100)
    private String authRequired;

    @Column(columnDefinition = "TEXT")
    private String errorCodes;

    @Column(length = 300)
    private String swaggerUrl;

    @Column(length = 300)
    private String postmanUrl;

    @Column(columnDefinition = "TEXT")
    private String requestBodyJson;

    @Column(columnDefinition = "TEXT")
    private String responseBodyJson;

    @Column(columnDefinition = "TEXT")
    private String changeNotes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private Boolean isDeleted = false;

    public ApiDoc() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getEnvironment() { return environment; }
    public void setEnvironment(String environment) { this.environment = environment; }

    public String getAuthRequired() { return authRequired; }
    public void setAuthRequired(String authRequired) { this.authRequired = authRequired; }

    public String getErrorCodes() { return errorCodes; }
    public void setErrorCodes(String errorCodes) { this.errorCodes = errorCodes; }

    public String getSwaggerUrl() { return swaggerUrl; }
    public void setSwaggerUrl(String swaggerUrl) { this.swaggerUrl = swaggerUrl; }

    public String getPostmanUrl() { return postmanUrl; }
    public void setPostmanUrl(String postmanUrl) { this.postmanUrl = postmanUrl; }

    public String getRequestBodyJson() { return requestBodyJson; }
    public void setRequestBodyJson(String requestBodyJson) { this.requestBodyJson = requestBodyJson; }

    public String getResponseBodyJson() { return responseBodyJson; }
    public void setResponseBodyJson(String responseBodyJson) { this.responseBodyJson = responseBodyJson; }

    public String getChangeNotes() { return changeNotes; }
    public void setChangeNotes(String changeNotes) { this.changeNotes = changeNotes; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }
}
