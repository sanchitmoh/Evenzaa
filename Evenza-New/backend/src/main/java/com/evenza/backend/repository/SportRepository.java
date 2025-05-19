package com.evenza.backend.repository;

import com.evenza.backend.model.Sport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SportRepository extends JpaRepository<Sport, String> {
    
    Page<Sport> findAll(Pageable pageable);
    
    @Query("SELECT s FROM Sport s WHERE " +
           "LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.sportType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.teams) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.league) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.venue) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.location) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Sport> searchSports(@Param("keyword") String keyword, Pageable pageable);
} 