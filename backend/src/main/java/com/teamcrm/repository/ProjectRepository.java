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
    Optional<Project> findByKeyCodeAndIsDeletedFalse(String keyCode);

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members LEFT JOIN FETCH p.owner WHERE p.isDeleted = false")
    List<Project> findAllActiveWithMembers();

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN FETCH p.members LEFT JOIN FETCH p.owner WHERE p.id = :id AND p.isDeleted = false")
    Optional<Project> findByIdWithMembers(@Param("id") Long id);

    List<Project> findByIsDeletedFalse();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE projects SET key_code = CONCAT(key_code, '_DEL_', id) WHERE is_deleted = true AND key_code NOT LIKE '%_DEL_%'", nativeQuery = true)
    void cleanupDeletedProjectKeyCodes();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "UPDATE projects SET key_code = CONCAT(key_code, '_DEL_', id) WHERE id = :id", nativeQuery = true)
    void releaseProjectKeyCode(@Param("id") Long id);
}

