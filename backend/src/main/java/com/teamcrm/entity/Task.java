package com.teamcrm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, unique = true, length = 30)
    private String taskCode; // e.g. 'CRM-101'

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 30)
    private String type = "FEATURE"; // 'FEATURE', 'BUG', 'QUERY', 'CHORE'

    @Column(nullable = false, length = 30)
    private String priority = "MEDIUM"; // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'

    @Column(nullable = false, length = 30)
    private String status = "TODO"; // 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED'

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    private User assignee;

    @Column(length = 500)
    private String assigneeIds;

    @Column(length = 1000)
    private String assigneeNames;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    private LocalDate dueDate;

    @Column(precision = 6, scale = 2)
    private BigDecimal estimatedHours = BigDecimal.ZERO;

    @Column(length = 255)
    private String labels;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_lead_id")
    private Lead linkedLead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_customer_id")
    private Customer linkedCustomer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_deal_id")
    private Deal linkedDeal;

    @Column(nullable = false)
    private Boolean checklistMustBeCompleted = true;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private Boolean isDeleted = false;

    @Version
    private Long version = 0L;

    public Task() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getAssignee() { return assignee; }
    public void setAssignee(User assignee) { this.assignee = assignee; }

    public String getAssigneeIds() { return assigneeIds; }
    public void setAssigneeIds(String assigneeIds) { this.assigneeIds = assigneeIds; }

    public String getAssigneeNames() { return assigneeNames; }
    public void setAssigneeNames(String assigneeNames) { this.assigneeNames = assigneeNames; }

    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public BigDecimal getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(BigDecimal estimatedHours) { this.estimatedHours = estimatedHours; }

    public String getLabels() { return labels; }
    public void setLabels(String labels) { this.labels = labels; }

    public Lead getLinkedLead() { return linkedLead; }
    public void setLinkedLead(Lead linkedLead) { this.linkedLead = linkedLead; }

    public Customer getLinkedCustomer() { return linkedCustomer; }
    public void setLinkedCustomer(Customer linkedCustomer) { this.linkedCustomer = linkedCustomer; }

    public Deal getLinkedDeal() { return linkedDeal; }
    public void setLinkedDeal(Deal linkedDeal) { this.linkedDeal = linkedDeal; }

    public Boolean getChecklistMustBeCompleted() { return checklistMustBeCompleted; }
    public void setChecklistMustBeCompleted(Boolean checklistMustBeCompleted) { this.checklistMustBeCompleted = checklistMustBeCompleted; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
