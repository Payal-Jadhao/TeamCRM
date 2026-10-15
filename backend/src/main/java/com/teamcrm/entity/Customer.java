package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "customers")
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(length = 80)
    private String industry;

    @Column(length = 200)
    private String website;

    @Column(length = 120)
    private String primaryContactName;

    @Column(length = 150)
    private String primaryContactEmail;

    @Column(length = 40)
    private String primaryContactPhone;

    @Column(columnDefinition = "TEXT")
    private String address;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_manager_id")
    private User accountManager;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();
    private Boolean isDeleted = false;

    public Customer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }

    public String getPrimaryContactName() { return primaryContactName; }
    public void setPrimaryContactName(String primaryContactName) { this.primaryContactName = primaryContactName; }

    public String getPrimaryContactEmail() { return primaryContactEmail; }
    public void setPrimaryContactEmail(String primaryContactEmail) { this.primaryContactEmail = primaryContactEmail; }

    public String getPrimaryContactPhone() { return primaryContactPhone; }
    public void setPrimaryContactPhone(String primaryContactPhone) { this.primaryContactPhone = primaryContactPhone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public User getAccountManager() { return accountManager; }
    public void setAccountManager(User accountManager) { this.accountManager = accountManager; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getIsDeleted() { return isDeleted; }
    public void setIsDeleted(Boolean deleted) { isDeleted = deleted; }
}
