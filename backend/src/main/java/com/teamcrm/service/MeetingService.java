package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;

    public MeetingService(MeetingRepository meetingRepository,
                          UserRepository userRepository,
                          TaskRepository taskRepository,
                          NotificationRepository notificationRepository,
                          AuditLogRepository auditLogRepository) {
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
    }

    public List<MeetingResponseDto> getAllMeetings() {
        return meetingRepository.findByOrderByStartTimeAsc().stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    public List<MeetingResponseDto> getUserMeetings(Long userId) {
        return meetingRepository.findMeetingsForUser(userId).stream()
                .map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public MeetingResponseDto scheduleMeeting(CreateMeetingRequest req, Long organizerId) {
        User organizer = userRepository.findById(organizerId)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        Meeting meeting = new Meeting();
        meeting.setTitle(req.title());
        meeting.setAgenda(req.agenda());
        meeting.setStartTime(req.startTime() != null ? req.startTime() : Instant.now().plusSeconds(3600));
        int duration = req.durationMinutes() != null ? req.durationMinutes() : 30;
        meeting.setDurationMinutes(duration);
        meeting.setEndTime(req.endTime() != null ? req.endTime() : meeting.getStartTime().plusSeconds((long) duration * 60));
        meeting.setMeetingLink(req.meetingLink() != null ? req.meetingLink() : "https://meet.google.com/crm-" + System.currentTimeMillis() % 10000);
        meeting.setLocation(req.location());
        meeting.setStatus("SCHEDULED");
        meeting.setOrganizer(organizer);

        if (req.linkedTaskId() != null) {
            taskRepository.findById(req.linkedTaskId()).ifPresent(meeting::setLinkedTask);
        }

        Set<User> attendees = new HashSet<>();
        attendees.add(organizer);
        if (req.attendeeIds() != null) {
            for (Long uid : req.attendeeIds()) {
                userRepository.findById(uid).ifPresent(attendees::add);
            }
        }
        meeting.setAttendees(attendees);

        Meeting saved = meetingRepository.save(meeting);

        // Send meeting invite notification to attendees
        for (User att : attendees) {
            if (!att.getId().equals(organizerId)) {
                Notification notif = new Notification();
                notif.setRecipient(att);
                notif.setSender(organizer);
                notif.setTitle("Meeting Invite: " + saved.getTitle());
                notif.setMessage(organizer.getFullName() + " scheduled a meeting: " + saved.getTitle() + " at " + saved.getStartTime());
                notif.setType("MEETING_INVITE");
                notif.setReferenceType("MEETING");
                notif.setReferenceId(saved.getId());
                notificationRepository.save(notif);
            }
        }

        auditLogRepository.save(new AuditLog(
                organizerId, null, "MEETING_SCHEDULE", "MEETING",
                saved.getId().toString(), null, "Scheduled meeting " + saved.getTitle()
        ));

        return mapToDto(saved);
    }

    @Transactional
    public MeetingResponseDto updateMeetingNotes(Long meetingId, String notes, String actionItemsJson, Long actorId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        meeting.setNotes(notes);
        meeting.setActionItemsJson(actionItemsJson);
        meeting.setUpdatedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);

        return mapToDto(saved);
    }

    @Transactional
    public MeetingResponseDto updateMeeting(Long meetingId, CreateMeetingRequest req, Long actorId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (req.title() != null && !req.title().isBlank()) meeting.setTitle(req.title().trim());
        if (req.agenda() != null) meeting.setAgenda(req.agenda().trim());
        if (req.startTime() != null) meeting.setStartTime(req.startTime());
        if (req.durationMinutes() != null) {
            meeting.setDurationMinutes(req.durationMinutes());
            meeting.setEndTime(meeting.getStartTime().plusSeconds((long) req.durationMinutes() * 60));
        } else if (req.endTime() != null) {
            meeting.setEndTime(req.endTime());
        }
        if (req.meetingLink() != null) meeting.setMeetingLink(req.meetingLink().trim());
        if (req.location() != null) meeting.setLocation(req.location());
        if (req.linkedTaskId() != null) {
            taskRepository.findById(req.linkedTaskId()).ifPresent(meeting::setLinkedTask);
        }

        if (req.attendeeIds() != null) {
            Set<User> attendees = new HashSet<>();
            attendees.add(meeting.getOrganizer());
            for (Long uid : req.attendeeIds()) {
                userRepository.findById(uid).ifPresent(attendees::add);
            }
            meeting.setAttendees(attendees);
        }

        meeting.setUpdatedAt(Instant.now());
        Meeting saved = meetingRepository.save(meeting);

        auditLogRepository.save(new AuditLog(
                actorId, null, "MEETING_UPDATE", "MEETING",
                saved.getId().toString(), null, "Updated meeting " + saved.getTitle()
        ));

        return mapToDto(saved);
    }

    @Transactional
    public void deleteMeeting(Long meetingId, Long actorId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        String title = meeting.getTitle();
        meetingRepository.delete(meeting);

        auditLogRepository.save(new AuditLog(
                actorId, null, "MEETING_DELETE", "MEETING",
                meetingId.toString(), title, "Deleted meeting " + title
        ));
    }

    private MeetingResponseDto mapToDto(Meeting m) {
        List<String> attendeeNames = m.getAttendees().stream()
                .map(User::getFullName).collect(Collectors.toList());

        return new MeetingResponseDto(
                m.getId(),
                m.getTitle(),
                m.getAgenda(),
                m.getStartTime(),
                m.getEndTime(),
                m.getDurationMinutes(),
                m.getMeetingLink(),
                m.getLocation(),
                m.getStatus(),
                m.getLinkedTask() != null ? m.getLinkedTask().getId() : null,
                m.getLinkedTask() != null ? m.getLinkedTask().getTitle() : null,
                m.getOrganizer().getId(),
                m.getOrganizer().getFullName(),
                attendeeNames,
                m.getNotes(),
                m.getActionItemsJson(),
                m.getCreatedAt()
        );
    }
}
