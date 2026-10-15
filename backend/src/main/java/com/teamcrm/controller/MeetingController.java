package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @GetMapping
    public ResponseEntity<List<MeetingResponseDto>> getAllMeetings() {
        return ResponseEntity.ok(meetingService.getAllMeetings());
    }

    @GetMapping("/my-meetings")
    public ResponseEntity<List<MeetingResponseDto>> getMyMeetings(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(meetingService.getUserMeetings(currentUser.getId()));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MEETING_SCHEDULE') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<MeetingResponseDto> scheduleMeeting(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CreateMeetingRequest request) {
        return ResponseEntity.ok(meetingService.scheduleMeeting(request, currentUser.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<MeetingResponseDto> updateMeeting(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CreateMeetingRequest request) {
        return ResponseEntity.ok(meetingService.updateMeeting(id, request, currentUser.getId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> deleteMeeting(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        meetingService.deleteMeeting(id, currentUser.getId());
        return ResponseEntity.ok().body("Meeting deleted successfully");
    }

    @PutMapping("/{id}/notes")
    public ResponseEntity<MeetingResponseDto> updateNotes(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody MeetingNotesUpdateRequest req) {
        return ResponseEntity.ok(meetingService.updateMeetingNotes(id, req.notes(), req.actionItemsJson(), currentUser.getId()));
    }

    public record MeetingNotesUpdateRequest(String notes, String actionItemsJson) {}
}
