package com.teamcrm.repository;

import com.teamcrm.entity.TaskChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskChecklistItemRepository extends JpaRepository<TaskChecklistItem, Long> {
    List<TaskChecklistItem> findByTaskIdOrderByPositionAsc(Long taskId);
    long countByTaskIdAndIsDoneFalse(Long taskId);
    long countByTaskId(Long taskId);
}
