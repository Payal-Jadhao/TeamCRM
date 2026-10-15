package com.teamcrm.repository;

import com.teamcrm.entity.ApiDoc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiDocRepository extends JpaRepository<ApiDoc, Long> {
    List<ApiDoc> findByIsDeletedFalseOrderByCreatedAtDesc();
    List<ApiDoc> findByTaskIdAndIsDeletedFalse(Long taskId);
    List<ApiDoc> findByStatusAndIsDeletedFalse(String status);
}
