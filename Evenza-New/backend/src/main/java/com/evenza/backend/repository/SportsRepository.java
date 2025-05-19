package com.evenza.backend.repository;

import com.evenza.backend.model.Sports;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;

@Repository
public interface SportsRepository extends JpaRepository<Sports, String> {

    @Query("SELECT s FROM Sports s WHERE " +
            "LOWER(s.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.venue) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.location) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(s.category) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Sports> searchByKeyword(@Param("keyword") String keyword);

    List<Sports> findByCategoryIgnoreCase(String category);
}
