package com.teamcrm.controller;

import com.teamcrm.dto.TimeTrackingDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.TimeTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/time")
public class TimeTrackingController {

    private final TimeTrackingService timeTrackingService;

    public TimeTrackingController(TimeTrackingService timeTrackingService) {
        this.timeTrackingService = timeTrackingService;
    }

    @PostMapping("/start")
    public ResponseEntity<RunningTimerDto> startTimer(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody StartTimerRequest request) {
        return ResponseEntity.ok(timeTrackingService.startTimer(request.taskId(), currentUser.getId(), request.note()));
    }

    @PostMapping("/stop")
    public ResponseEntity<TimeLogResponseDto> stopTimer(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody(required = false) StopTimerRequest request) {
        String note = request != null ? request.note() : null;
        return ResponseEntity.ok(timeTrackingService.stopTimer(currentUser.getId(), note));
    }

    @GetMapping("/active")
    public ResponseEntity<RunningTimerDto> getActiveTimer(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        RunningTimerDto active = timeTrackingService.getActiveTimerForUser(currentUser.getId());
        return ResponseEntity.ok(active);
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TimeLogResponseDto>> getTaskLogs(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeTrackingService.getTaskTimeLogs(taskId));
    }

    @GetMapping("/my-logs")
    public ResponseEntity<List<TimeLogResponseDto>> getMyLogs(
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(timeTrackingService.getUserTimeLogs(currentUser.getId()));
    }

    @PostMapping("/manual")
    @PreAuthorize("hasAuthority('TIME_EDIT_MANUAL') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<TimeLogResponseDto> createManualLog(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody ManualTimeLogRequest request) {
        return ResponseEntity.ok(timeTrackingService.createManualTimeLog(request, currentUser.getId()));
    }
}
