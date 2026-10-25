package com.teamcrm.repository;

import com.teamcrm.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailAndIsActiveTrue(String email);
    Boolean existsByEmail(String email);
    List<User> findByIsActiveTrue();
    List<User> findByTeamTag(String teamTag);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM user_permissions WHERE user_id = :userId", nativeQuery = true)
    void deleteUserPermissions(@org.springframework.data.repository.query.Param("userId") Long userId);
}

