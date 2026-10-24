package com.teamcrm.controller;

import com.teamcrm.dto.OtherDtos.ProjectResponseDto;
import com.teamcrm.entity.Project;
import com.teamcrm.entity.User;
import com.teamcrm.repository.ProjectRepository;
import com.teamcrm.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectController(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ProjectResponseDto>> getAllProjects() {
        List<Project> list = projectRepository.findAllActiveWithMembers();
        List<ProjectResponseDto> dtos = list.stream().map(this::toDto).toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ProjectResponseDto> getProjectById(@PathVariable Long id) {
        return projectRepository.findByIdWithMembers(id)
                .map(p -> ResponseEntity.ok(toDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ProjectResponseDto> createProject(@RequestBody Map<String, Object> payload) {
        Project project = new Project();
        project.setName((String) payload.getOrDefault("name", "New Project"));
        project.setKeyCode(((String) payload.getOrDefault("keyCode", "PRJ")).toUpperCase().trim());
        project.setDescription((String) payload.getOrDefault("description", ""));
        project.setStatus((String) payload.getOrDefault("status", "ACTIVE"));
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        project.setIsDeleted(false);

        Set<User> members = new HashSet<>();
        if (payload.containsKey("managerIds") && payload.get("managerIds") instanceof List<?> mgrs) {
            for (Object mId : mgrs) {
                if (mId instanceof Number n) {
                    userRepository.findById(n.longValue()).ifPresent(members::add);
                }
            }
        }
        if (payload.containsKey("employeeIds") && payload.get("employeeIds") instanceof List<?> emps) {
            for (Object eId : emps) {
                if (eId instanceof Number n) {
                    userRepository.findById(n.longValue()).ifPresent(members::add);
                }
            }
        }
        project.setMembers(members);

        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ProjectResponseDto> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return projectRepository.findByIdWithMembers(id).map(project -> {
            if (payload.containsKey("name")) project.setName((String) payload.get("name"));
            if (payload.containsKey("keyCode")) project.setKeyCode(((String) payload.get("keyCode")).toUpperCase().trim());
            if (payload.containsKey("description")) project.setDescription((String) payload.get("description"));
            if (payload.containsKey("status")) project.setStatus((String) payload.get("status"));
            project.setUpdatedAt(Instant.now());

            if (payload.containsKey("managerIds") || payload.containsKey("employeeIds")) {
                Set<User> members = new HashSet<>();
                if (payload.containsKey("managerIds") && payload.get("managerIds") instanceof List<?> mgrs) {
                    for (Object mId : mgrs) {
                        if (mId instanceof Number n) {
                            userRepository.findById(n.longValue()).ifPresent(members::add);
                        }
                    }
                }
                if (payload.containsKey("employeeIds") && payload.get("employeeIds") instanceof List<?> emps) {
                    for (Object eId : emps) {
                        if (eId instanceof Number n) {
                            userRepository.findById(n.longValue()).ifPresent(members::add);
                        }
                    }
                }
                project.setMembers(members);
            }

            Project saved = projectRepository.save(project);
            return ResponseEntity.ok(toDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        return projectRepository.findById(id).map(project -> {
            project.setIsDeleted(true);
            projectRepository.save(project);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }

    private ProjectResponseDto toDto(Project project) {
        Long ownerId = project.getOwner() != null ? project.getOwner().getId() : null;
        String ownerName = project.getOwner() != null ? project.getOwner().getFullName() : null;

        List<Long> managerIds = new ArrayList<>();
        List<Long> employeeIds = new ArrayList<>();

        if (project.getMembers() != null) {
            for (User u : project.getMembers()) {
                String role = u.getRole() != null ? u.getRole().getName() : "";
                if (role.contains("MANAGER")) {
                    managerIds.add(u.getId());
                } else {
                    employeeIds.add(u.getId());
                }
            }
        }

        return new ProjectResponseDto(
                project.getId(),
                project.getName(),
                project.getKeyCode(),
                project.getDescription(),
                project.getStatus(),
                ownerId,
                ownerName,
                managerIds,
                employeeIds,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
