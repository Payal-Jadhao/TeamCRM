package com.teamcrm.repository;

import com.teamcrm.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByKeyCode(String keyCode);
    List<Project> findByIsDeletedFalse();
}
