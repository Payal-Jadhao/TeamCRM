package com.teamcrm.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "meetings")
public class Meeting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(nullable = false)
    private Instant startTime;

    @Column(nullable = false)
    private Instant endTime;

    @Column(nullable = false)
    private Integer durationMinutes = 30;

    @Column(length = 300)
    private String meetingLink;

    @Column(length = 150)
    private String location;

    @Column(length = 30)
    private String status = "SCHEDULED"; // 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "linked_task_id")
    private Task linkedTask;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organizer_id", nullable = false)
    private User organizer;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "meeting_attendees_map",
        joinColumns = @JoinColumn(name = "meeting_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> attendees = new HashSet<>();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String actionItemsJson;

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

    public Meeting() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getAgenda() { return agenda; }
    public void setAgenda(String agenda) { this.agenda = agenda; }

    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }

    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getMeetingLink() { return meetingLink; }
    public void setMeetingLink(String meetingLink) { this.meetingLink = meetingLink; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Task getLinkedTask() { return linkedTask; }
    public void setLinkedTask(Task linkedTask) { this.linkedTask = linkedTask; }

    public User getOrganizer() { return organizer; }
    public void setOrganizer(User organizer) { this.organizer = organizer; }

    public Set<User> getAttendees() { return attendees; }
    public void setAttendees(Set<User> attendees) { this.attendees = attendees; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getActionItemsJson() { return actionItemsJson; }
    public void setActionItemsJson(String actionItemsJson) { this.actionItemsJson = actionItemsJson; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
