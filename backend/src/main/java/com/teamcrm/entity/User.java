package com.teamcrm.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String fullName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "team_tag", length = 50)
    private String teamTag; // 'FRONTEND', 'BACKEND', 'SALES', 'QA', 'DESIGN'

    private String phone;
    private String avatarUrl;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(nullable = false)
    private Boolean isFirstLogin = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_permissions",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    private Set<Permission> extraPermissions = new HashSet<>();

    private Long createdBy;
    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    @Column(length = 100)
    private String initialPassword = "Password123!";

    @Version
    private Long version = 0L;

    public String getInitialPassword() { return initialPassword; }
    public void setInitialPassword(String initialPassword) { this.initialPassword = initialPassword; }

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getTeamTag() { return teamTag; }
    public void setTeamTag(String teamTag) { this.teamTag = teamTag; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public Boolean getIsFirstLogin() { return isFirstLogin; }
    public void setIsFirstLogin(Boolean firstLogin) { isFirstLogin = firstLogin; }

    public Set<Permission> getExtraPermissions() { return extraPermissions; }
    public void setExtraPermissions(Set<Permission> extraPermissions) { this.extraPermissions = extraPermissions; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
