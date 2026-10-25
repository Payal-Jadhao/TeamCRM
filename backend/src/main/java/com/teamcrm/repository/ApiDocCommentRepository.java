package com.teamcrm.repository;

import com.teamcrm.entity.ApiDocComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiDocCommentRepository extends JpaRepository<ApiDocComment, Long> {
    List<ApiDocComment> findByApiDocIdOrderByCreatedAtAsc(Long apiDocId);
}
