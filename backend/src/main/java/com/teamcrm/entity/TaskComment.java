package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "task_comments")
public class TaskComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 30)
    private String type = "GENERAL"; // 'QUERY', 'BLOCKER', 'UPDATE', 'GENERAL'

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    private Long parentId;

    @Column(length = 30)
    private String status = "OPEN"; // 'OPEN', 'ANSWERED', 'RESOLVED'

    private Boolean isDeleted = false;
    private Instant editedAt;
    private Instant createdAt = Instant.now();

    public TaskComment() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }

    public Instant getEditedAt() { return editedAt; }
    public void setEditedAt(Instant editedAt) { this.editedAt = editedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
