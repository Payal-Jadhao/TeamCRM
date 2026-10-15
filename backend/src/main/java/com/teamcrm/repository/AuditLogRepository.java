package com.teamcrm.repository;

import com.teamcrm.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop100ByOrderByCreatedAtDesc();
    List<AuditLog> findByEntityNameOrderByCreatedAtDesc(String entityName);
    List<AuditLog> findByActorIdOrderByCreatedAtDesc(Long actorId);
}
