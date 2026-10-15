package com.teamcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code; // e.g. 'TASK_CREATE', 'TIME_EDIT_MANUAL'

    @Column(nullable = false, length = 50)
    private String module; // 'TASKS', 'CRM', 'MEETINGS', etc.

    private String description;

    public Permission() {}

    public Permission(String code, String module, String description) {
        this.code = code;
        this.module = module;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getModule() { return module; }
    public void setModule(String module) { this.module = module; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
