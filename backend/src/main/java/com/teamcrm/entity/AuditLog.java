package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long actorId;
    private String actorEmail;

    @Column(nullable = false, length = 80)
    private String action; // 'USER_CREATE', 'TASK_STATUS_CHANGE', 'TIME_EDIT_MANUAL', etc.

    @Column(nullable = false, length = 60)
    private String entityName; // 'TASK', 'USER', 'TIME_LOG', 'PERMISSION', 'MEETING'

    @Column(length = 60)
    private String entityId;

    @Column(columnDefinition = "TEXT")
    private String oldValue;

    @Column(columnDefinition = "TEXT")
    private String newValue;

    @Column(length = 45)
    private String ipAddress;

    private Instant createdAt = Instant.now();

    public AuditLog() {}

    public AuditLog(Long actorId, String actorEmail, String action, String entityName, String entityId, String oldValue, String newValue) {
        this.actorId = actorId;
        this.actorEmail = actorEmail;
        this.action = action;
        this.entityName = entityName;
        this.entityId = entityId;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getEntityName() { return entityName; }
    public void setEntityName(String entityName) { this.entityName = entityName; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getOldValue() { return oldValue; }
    public void setOldValue(String oldValue) { this.oldValue = oldValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
