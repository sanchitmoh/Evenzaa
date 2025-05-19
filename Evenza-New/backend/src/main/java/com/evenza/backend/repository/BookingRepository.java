package com.evenza.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.evenza.backend.model.Booking;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    List<Booking> findByUserId(String userId);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId ORDER BY b.bookingTime DESC")
    List<Booking> findUserBookingsOrderByTimeDesc(@Param("userId") String userId);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = :userId OR b.userId LIKE CONCAT('%', :userId, '%') ORDER BY b.bookingTime DESC")
    List<Booking> findUserBookingsByPartialUserId(@Param("userId") String userId);
    
    List<Booking> findByStatus(String status);
    
    long countByStatus(String status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.status = ?1")
    long countByStatusCustom(String status);
    
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC LIMIT 5")
    List<Booking> findTop5ByOrderByCreatedAtDesc();
    
    @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC LIMIT 10")
    List<Booking> findTop10ByOrderByCreatedAtDesc();
    
    @Query("SELECT b FROM Booking b WHERE b.userId = ?1 AND b.status = 'CONFIRMED' AND b.bookingTime > CURRENT_TIMESTAMP")
    List<Booking> findUserUpcomingBookings(String userId);
    
    @Query("SELECT b FROM Booking b WHERE b.userId = ?1 AND (b.status != 'CONFIRMED' OR b.bookingTime < CURRENT_TIMESTAMP)")
    List<Booking> findUserPastBookings(String userId);

    boolean existsBySeatId(String seatId);

    List<Booking> findByEntityTypeAndEntityId(String entityType, String entityId);
    
    @Query("SELECT b FROM Booking b WHERE b.entityType = :entityType AND b.entityId = :entityId")
    List<Booking> findBookingsByEntityTypeAndId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    @Query("SELECT b FROM Booking b WHERE CAST(b.id AS string) = :stringId")
    Optional<Booking> findByStringId(String stringId);

}
