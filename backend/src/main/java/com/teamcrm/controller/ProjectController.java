package com.teamcrm.controller;

import com.teamcrm.entity.Project;
import com.teamcrm.entity.User;
import com.teamcrm.repository.ProjectRepository;
import com.teamcrm.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

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
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findByIsDeletedFalse());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return projectRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Map<String, Object> payload) {
        Project project = new Project();
        project.setName((String) payload.getOrDefault("name", "New Project"));
        project.setKeyCode(((String) payload.getOrDefault("keyCode", "PRJ")).toUpperCase().trim());
        project.setDescription((String) payload.getOrDefault("description", ""));
        project.setStatus((String) payload.getOrDefault("status", "ACTIVE"));
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        project.setIsDeleted(false);

        Set<User> members = new HashSet<>();
        if (payload.containsKey("managerIds")) {
            List<Number> mgrs = (List<Number>) payload.get("managerIds");
            for (Number mId : mgrs) {
                userRepository.findById(mId.longValue()).ifPresent(members::add);
            }
        }
        if (payload.containsKey("employeeIds")) {
            List<Number> emps = (List<Number>) payload.get("employeeIds");
            for (Number eId : emps) {
                userRepository.findById(eId.longValue()).ifPresent(members::add);
            }
        }
        project.setMembers(members);

        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return projectRepository.findById(id).map(project -> {
            if (payload.containsKey("name")) project.setName((String) payload.get("name"));
            if (payload.containsKey("keyCode")) project.setKeyCode(((String) payload.get("keyCode")).toUpperCase().trim());
            if (payload.containsKey("description")) project.setDescription((String) payload.get("description"));
            if (payload.containsKey("status")) project.setStatus((String) payload.get("status"));
            project.setUpdatedAt(Instant.now());

            Set<User> members = new HashSet<>(project.getMembers());
            if (payload.containsKey("managerIds") || payload.containsKey("employeeIds")) {
                members.clear();
                if (payload.containsKey("managerIds")) {
                    List<Number> mgrs = (List<Number>) payload.get("managerIds");
                    for (Number mId : mgrs) {
                        userRepository.findById(mId.longValue()).ifPresent(members::add);
                    }
                }
                if (payload.containsKey("employeeIds")) {
                    List<Number> emps = (List<Number>) payload.get("employeeIds");
                    for (Number eId : emps) {
                        userRepository.findById(eId.longValue()).ifPresent(members::add);
                    }
                }
                project.setMembers(members);
            }

            Project saved = projectRepository.save(project);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        return projectRepository.findById(id).map(project -> {
            project.setIsDeleted(true);
            projectRepository.save(project);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
