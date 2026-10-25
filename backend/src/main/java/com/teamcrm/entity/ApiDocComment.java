package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "api_doc_comments")
public class ApiDocComment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "api_doc_id", nullable = false)
    private ApiDoc apiDoc;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(length = 150)
    private String authorName;

    @Column(length = 60)
    private String authorRole;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String text;

    private Instant createdAt = Instant.now();

    public ApiDocComment() {}

    public ApiDocComment(ApiDoc apiDoc, User author, String authorName, String authorRole, String text) {
        this.apiDoc = apiDoc;
        this.author = author;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.text = text;
        this.createdAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ApiDoc getApiDoc() { return apiDoc; }
    public void setApiDoc(ApiDoc apiDoc) { this.apiDoc = apiDoc; }

    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
