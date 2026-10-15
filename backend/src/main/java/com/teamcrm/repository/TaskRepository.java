package com.teamcrm.repository;

import com.teamcrm.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Optional<Task> findByTaskCode(String taskCode);
    List<Task> findByProjectIdAndIsDeletedFalse(Long projectId);
    List<Task> findByAssigneeIdAndIsDeletedFalse(Long assigneeId);
    List<Task> findByIsDeletedFalse();

    @Query("SELECT t FROM Task t WHERE t.isDeleted = false " +
           "AND (:projectId IS NULL OR t.project.id = :projectId) " +
           "AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:priority IS NULL OR t.priority = :priority)")
    List<Task> findFilteredTasks(
            @Param("projectId") Long projectId,
            @Param("assigneeId") Long assigneeId,
            @Param("status") String status,
            @Param("priority") String priority);
}
