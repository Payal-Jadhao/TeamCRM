package com.teamcrm.repository;

import com.teamcrm.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {
    List<Deal> findByIsDeletedFalseOrderByCreatedAtDesc();
    List<Deal> findByStageAndIsDeletedFalse(String stage);
    List<Deal> findByAssignedToIdAndIsDeletedFalse(Long assignedToId);
}
