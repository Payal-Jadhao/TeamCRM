package com.teamcrm.repository;

import com.teamcrm.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByKeyCode(String keyCode);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members LEFT JOIN FETCH p.owner WHERE p.isDeleted = false")
    List<Project> findAllActiveWithMembers();

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members LEFT JOIN FETCH p.owner WHERE p.id = :id AND p.isDeleted = false")
    Optional<Project> findByIdWithMembers(@Param("id") Long id);

    List<Project> findByIsDeletedFalse();
}
