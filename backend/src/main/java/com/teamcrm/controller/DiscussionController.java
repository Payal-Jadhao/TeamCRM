package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.security.UserDetailsImpl;
import com.teamcrm.service.DiscussionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;

    public DiscussionController(DiscussionService discussionService) {
        this.discussionService = discussionService;
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<CommentResponseDto>> getTaskComments(
            @PathVariable Long taskId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(discussionService.getCommentsByTaskId(taskId, type));
    }

    @PostMapping
    public ResponseEntity<CommentResponseDto> postComment(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody CreateCommentRequest request) {
        return ResponseEntity.ok(discussionService.postComment(request, currentUser.getId()));
    }

    @PatchMapping("/{commentId}/status")
    public ResponseEntity<CommentResponseDto> updateQueryStatus(
            @PathVariable Long commentId,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(discussionService.updateQueryStatus(commentId, status, currentUser.getId()));
    }
}
