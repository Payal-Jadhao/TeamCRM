package com.teamcrm.repository;

import com.teamcrm.entity.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, Long> {
    List<Meeting> findByOrderByStartTimeAsc();

    @Query("SELECT m FROM Meeting m JOIN m.attendees a WHERE a.id = :userId OR m.organizer.id = :userId ORDER BY m.startTime ASC")
    List<Meeting> findMeetingsForUser(@Param("userId") Long userId);

    @Query("SELECT m FROM Meeting m WHERE m.startTime BETWEEN :start AND :end ORDER BY m.startTime ASC")
    List<Meeting> findMeetingsBetween(@Param("start") Instant start, @Param("end") Instant end);
}
