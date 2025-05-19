package com.evenza.backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.evenza.backend.model.Payment;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<Payment> findByUserId(String userId);
    List<Payment> findByOrderId(String orderId);
    List<Payment> findByStatus(String status);
    long countByStatus(String status);
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = ?1")
    long countByStatusCustom(String status);
    @Query("SELECT p FROM Payment p ORDER BY p.createdAt DESC LIMIT 5")
    List<Payment> findTop5ByOrderByCreatedAtDesc();
    @Query("SELECT p FROM Payment p ORDER BY p.createdAt DESC LIMIT 10")
    List<Payment> findTop10ByOrderByCreatedAtDesc();
    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.status = 'SUCCESS'")
    BigDecimal getTotalSuccessfulPaymentAmount();
    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day, SUM(amount) as total FROM payment " +
           "WHERE status = 'SUCCESS' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) " +
           "GROUP BY day ORDER BY day", nativeQuery = true)
    List<Object[]> getDailySalesData();
    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as week, SUM(amount) as total FROM payment " +
           "WHERE status = 'SUCCESS' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 8 WEEK) " +
           "GROUP BY week ORDER BY week", nativeQuery = true)
    List<Object[]> getWeeklySalesData();
    @Query(value = "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total FROM payment " +
           "WHERE status = 'SUCCESS' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH) " +
           "GROUP BY month ORDER BY month", nativeQuery = true)
    List<Object[]> getMonthlySalesData();
}
