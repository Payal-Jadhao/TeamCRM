package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "task_checklist_items")
public class TaskChecklistItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false, length = 255)
    private String text;

    @Column(nullable = false)
    private Boolean isDone = false;

    @Column(nullable = false)
    private Integer position = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "done_by")
    private User doneBy;

    private Instant doneAt;
    private Instant createdAt = Instant.now();

    public TaskChecklistItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Boolean getIsDone() { return isDone; }
    public void setIsDone(Boolean done) { isDone = done; }

    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }

    public User getDoneBy() { return doneBy; }
    public void setDoneBy(User doneBy) { this.doneBy = doneBy; }

    public Instant getDoneAt() { return doneAt; }
    public void setDoneAt(Instant doneAt) { this.doneAt = doneAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
