package com.teamcrm.repository;

import com.teamcrm.entity.MasterItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MasterRepository extends JpaRepository<MasterItem, Long> {
    List<MasterItem> findByIsDeletedFalseOrderByCategoryAscSortOrderAsc();
    List<MasterItem> findByCategoryAndIsDeletedFalseOrderBySortOrderAsc(String category);
    List<MasterItem> findByCategoryAndIsActiveTrueAndIsDeletedFalseOrderBySortOrderAsc(String category);
}
