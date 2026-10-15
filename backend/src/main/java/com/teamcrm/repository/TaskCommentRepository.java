package com.teamcrm.repository;

import com.teamcrm.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, Long> {
    List<TaskComment> findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(Long taskId);
    List<TaskComment> findByTaskIdAndTypeAndIsDeletedFalseOrderByCreatedAtAsc(Long taskId, String type);
}
