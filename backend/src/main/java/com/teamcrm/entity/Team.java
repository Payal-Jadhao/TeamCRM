package com.teamcrm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "teams")
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String tag; // 'FRONTEND', 'BACKEND', 'QA', 'SALES', 'DESIGN'

    private String description;

    public Team() {}

    public Team(String name, String tag, String description) {
        this.name = name;
        this.tag = tag;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
