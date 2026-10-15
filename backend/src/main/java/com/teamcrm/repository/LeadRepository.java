package com.teamcrm.repository;

import com.teamcrm.entity.Lead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByIsDeletedFalseOrderByCreatedAtDesc();
    List<Lead> findByStatusAndIsDeletedFalse(String status);
    List<Lead> findByAssignedToIdAndIsDeletedFalse(Long assignedToId);
}
