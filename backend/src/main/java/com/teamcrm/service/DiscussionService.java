package com.teamcrm.service;

import com.teamcrm.dto.OtherDtos.*;
import com.teamcrm.entity.*;
import com.teamcrm.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class DiscussionService {

    private final TaskCommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public DiscussionService(TaskCommentRepository commentRepository,
                             TaskRepository taskRepository,
                             UserRepository userRepository,
                             NotificationRepository notificationRepository,
                             SimpMessagingTemplate messagingTemplate) {
        this.commentRepository = commentRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<CommentResponseDto> getCommentsByTaskId(Long taskId, String type) {
        List<TaskComment> comments = (type != null && !type.isBlank())
                ? commentRepository.findByTaskIdAndTypeAndIsDeletedFalseOrderByCreatedAtAsc(taskId, type)
                : commentRepository.findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(taskId);

        return comments.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional
    public CommentResponseDto postComment(CreateCommentRequest req, Long authorId) {
        Task task = taskRepository.findById(req.taskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setType(req.type() != null ? req.type() : "GENERAL");
        comment.setBody(req.body());
        comment.setParentId(req.parentId());
        comment.setStatus("OPEN");

        TaskComment saved = commentRepository.save(comment);

        // Detect @mentions in body
        parseAndNotifyMentions(saved, author, task);

        return mapToDto(saved);
    }

    @Transactional
    public CommentResponseDto updateQueryStatus(Long commentId, String newStatus, Long userId) {
        TaskComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
        comment.setStatus(newStatus.toUpperCase());
        comment.setEditedAt(Instant.now());
        TaskComment saved = commentRepository.save(comment);
        return mapToDto(saved);
    }

    private void parseAndNotifyMentions(TaskComment comment, User author, Task task) {
        // Find @username or @team
        Pattern mentionPattern = Pattern.compile("@([a-zA-Z0-9._]+)");
        Matcher matcher = mentionPattern.matcher(comment.getBody());

        while (matcher.find()) {
            String mention = matcher.group(1).toLowerCase();

            // Check if mentioning team
            if ("frontend".equals(mention) || "backend".equals(mention) || "qa".equals(mention) || "sales".equals(mention)) {
                List<User> teamUsers = userRepository.findByTeamTag(mention.toUpperCase());
                for (User u : teamUsers) {
                    if (!u.getId().equals(author.getId())) {
                        createNotification(u, author, "Team Mention on " + task.getTaskCode(),
                                author.getFullName() + " mentioned @" + mention + ": " + comment.getBody(),
                                "MENTION", "TASK", task.getId());
                    }
                }
            } else {
                // Individual user mention (by email prefix or match)
                userRepository.findAll().stream()
                        .filter(u -> u.getEmail().toLowerCase().startsWith(mention) || u.getFullName().toLowerCase().contains(mention))
                        .filter(u -> !u.getId().equals(author.getId()))
                        .findFirst()
                        .ifPresent(u -> createNotification(u, author, "Mentioned by " + author.getFullName(),
                                author.getFullName() + " mentioned you on " + task.getTaskCode() + ": " + comment.getBody(),
                                "MENTION", "TASK", task.getId()));
            }
        }
    }

    private void createNotification(User recipient, User sender, String title, String msg, String type, String refType, Long refId) {
        Notification notif = new Notification();
        notif.setRecipient(recipient);
        notif.setSender(sender);
        notif.setTitle(title);
        notif.setMessage(msg);
        notif.setType(type);
        notif.setReferenceType(refType);
        notif.setReferenceId(refId);
        notif.setIsRead(false);
        notificationRepository.save(notif);

        // Send over WebSocket if connected
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getId(), notif);
        } catch (Exception ignored) {}
    }

    private CommentResponseDto mapToDto(TaskComment c) {
        return new CommentResponseDto(
                c.getId(),
                c.getTask().getId(),
                c.getAuthor().getId(),
                c.getAuthor().getFullName(),
                c.getAuthor().getTeamTag(),
                c.getAuthor().getAvatarUrl(),
                c.getType(),
                c.getBody(),
                c.getParentId(),
                c.getStatus(),
                c.getCreatedAt()
        );
    }
}
