package com.teamcrm.repository;

import com.teamcrm.entity.TaskTimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskTimeLogRepository extends JpaRepository<TaskTimeLog, Long> {
    List<TaskTimeLog> findByTaskIdOrderByStartTimeDesc(Long taskId);
    List<TaskTimeLog> findByUserIdOrderByStartTimeDesc(Long userId);

    @Query("SELECT l FROM TaskTimeLog l WHERE l.user.id = :userId AND l.endTime IS NULL")
    Optional<TaskTimeLog> findActiveLogByUserId(@Param("userId") Long userId);

    @Query("SELECT l FROM TaskTimeLog l WHERE l.endTime IS NULL")
    List<TaskTimeLog> findAllActiveLogs();

    @Query("SELECT SUM(l.durationSeconds) FROM TaskTimeLog l WHERE l.task.id = :taskId")
    Long getTotalDurationSecondsByTaskId(@Param("taskId") Long taskId);

    @Query("SELECT l FROM TaskTimeLog l WHERE l.startTime >= :since ORDER BY l.startTime DESC")
    List<TaskTimeLog> findLogsSince(@Param("since") Instant since);
}
