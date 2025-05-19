package com.evenza.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.evenza.backend.model.Ticket;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, String> {
    
    List<Ticket> findByUserId(String userId);
    
    List<Ticket> findByBookingId(String bookingId);
    
    List<Ticket> findByUserEmail(String userEmail);
    
    List<Ticket> findByEntityTypeAndEntityId(String entityType, String entityId);
    
    @Query("SELECT t FROM Ticket t WHERE t.userId = :userId ORDER BY t.createdAt DESC")
    List<Ticket> findUserTicketsOrderByCreationDesc(@Param("userId") String userId);
    
    @Query("SELECT t FROM Ticket t WHERE t.eventDateTime > :now AND t.isUsed = false AND t.userId = :userId ORDER BY t.eventDateTime ASC")
    List<Ticket> findUpcomingTicketsByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);
    
    @Query("SELECT t FROM Ticket t WHERE t.eventDateTime < :now OR t.isUsed = true AND t.userId = :userId ORDER BY t.eventDateTime DESC")
    List<Ticket> findPastTicketsByUserId(@Param("userId") String userId, @Param("now") LocalDateTime now);
    
    Optional<Ticket> findByIdAndIsUsedFalse(String ticketId);
} 