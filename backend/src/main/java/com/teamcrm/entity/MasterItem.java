package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "masters")
public class MasterItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String category; // 'TEAM', 'TASK_TYPE', 'LEAD_STATUS', 'DEAL_STAGE'

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 50)
    private String keyCode;

    @Column(nullable = false)
    private Integer sortOrder = 1;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isDeleted = false;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public MasterItem() {}

    public MasterItem(String category, String name, String keyCode, Integer sortOrder) {
        this.category = category;
        this.name = name;
        this.keyCode = keyCode;
        this.sortOrder = sortOrder;
        this.isActive = true;
        this.isDeleted = false;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getKeyCode() { return keyCode; }
    public void setKeyCode(String keyCode) { this.keyCode = keyCode; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
