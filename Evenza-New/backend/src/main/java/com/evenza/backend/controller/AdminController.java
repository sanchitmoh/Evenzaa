package com.evenza.backend.controller;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.ConcertRepository;
import com.evenza.backend.repository.EventRepository;
import com.evenza.backend.repository.MovieRepository;
import com.evenza.backend.repository.PaymentRepository;
import com.evenza.backend.repository.SportsRepository;
import com.evenza.backend.repository.UserRepository;
import com.evenza.backend.services.UserDetailsImpl;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class AdminController {
    
    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private PaymentRepository paymentRepository;
    
    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private ConcertRepository concertRepository;
    
    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private SportsRepository sportsRepository;
    
    /**
     * Get dashboard overview statistics for admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        // Log authentication info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Admin dashboard accessed by: {}", auth.getName());
        logger.info("User has authorities: {}", auth.getAuthorities());
        
        if (auth.getPrincipal() instanceof UserDetailsImpl) {
            UserDetailsImpl userDetails = (UserDetailsImpl) auth.getPrincipal();
            logger.info("User role from UserDetails: {}", userDetails.getAuthorities());
        }
        
        logger.info("Fetching admin dashboard statistics");
        
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // User statistics
            long totalUsers = userRepository.count();
            
            // Booking statistics
            long totalBookings = bookingRepository.count();
            long confirmedBookings = bookingRepository.countByStatus("CONFIRMED");
            long cancelledBookings = bookingRepository.countByStatus("CANCELLED");
            
            // Payment statistics
            long totalPayments = paymentRepository.count();
            long successfulPayments = paymentRepository.countByStatus("SUCCESS");
            long failedPayments = paymentRepository.countByStatus("FAILED");
            BigDecimal totalRevenue = paymentRepository.getTotalSuccessfulPaymentAmount();
            
            // Event type counts
            long eventCount = eventRepository.count();
            long concertCount = concertRepository.count();
            long movieCount = movieRepository.count();
            long sportsCount = sportsRepository.count();
            
            // Compile all statistics
            stats.put("totalUsers", totalUsers);
            stats.put("totalBookings", totalBookings);
            stats.put("confirmedBookings", confirmedBookings);
            stats.put("cancelledBookings", cancelledBookings);
            stats.put("totalPayments", totalPayments);
            stats.put("successfulPayments", successfulPayments);
            stats.put("failedPayments", failedPayments);
            stats.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);
            
            // Event statistics
            Map<String, Object> eventStats = new HashMap<>();
            eventStats.put("events", eventCount);
            eventStats.put("concerts", concertCount);
            eventStats.put("movies", movieCount);
            eventStats.put("sports", sportsCount);
            stats.put("eventStats", eventStats);
            
            // Recent activities
            stats.put("recentBookings", bookingRepository.findTop5ByOrderByCreatedAtDesc());
            stats.put("recentPayments", paymentRepository.findTop5ByOrderByCreatedAtDesc());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching admin dashboard statistics", e);
            stats.put("error", "Failed to fetch dashboard statistics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(stats);
        }
    }
    
    /**
     * Get sales data for charts
     */
    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> getSalesData(
            @RequestParam(required = false, defaultValue = "weekly") String period) {
        
        // Log authentication info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Admin sales data accessed by: {}", auth.getName());
        
        logger.info("Fetching sales data for period: {}", period);
        Map<String, Object> salesData = new HashMap<>();
        
        try {
            // Get sales data for the requested period (daily, weekly, monthly)
            List<Object[]> periodSalesData;
            
            switch (period.toLowerCase()) {
                case "daily":
                    periodSalesData = paymentRepository.getDailySalesData();
                    break;
                case "monthly":
                    periodSalesData = paymentRepository.getMonthlySalesData();
                    break;
                case "weekly":
                default:
                    periodSalesData = paymentRepository.getWeeklySalesData();
                    break;
            }
            
            // Process and format the sales data
            Map<String, Object> formattedData = new HashMap<>();
            Map<String, Object> labels = new HashMap<>();
            Map<String, Object> values = new HashMap<>();
            
            for (Object[] dataPoint : periodSalesData) {
                String timeLabel = (String) dataPoint[0];
                
                // Handle the amount value correctly, converting Double to BigDecimal if needed
                Object amountObj = dataPoint[1];
                BigDecimal amount;
                
                if (amountObj instanceof BigDecimal) {
                    amount = (BigDecimal) amountObj;
                } else if (amountObj instanceof Double) {
                    amount = BigDecimal.valueOf((Double) amountObj);
                } else {
                    // Fallback for other numeric types
                    amount = new BigDecimal(String.valueOf(amountObj));
                }
                
                // Add to arrays
                labels.put(timeLabel, timeLabel);
                values.put(timeLabel, amount);
            }
            
            formattedData.put("labels", labels.keySet());
            formattedData.put("data", values.values());
            
            salesData.put("period", period);
            salesData.put("salesData", formattedData);
            
            return ResponseEntity.ok(salesData);
        } catch (Exception e) {
            logger.error("Error fetching sales data", e);
            salesData.put("error", "Failed to fetch sales data: " + e.getMessage());
            return ResponseEntity.internalServerError().body(salesData);
        }
    }
    
    /**
     * Get recent activity for admin dashboard
     */
    @GetMapping("/activities")
    public ResponseEntity<Map<String, Object>> getRecentActivities() {
        // Log authentication info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Admin activities accessed by: {}", auth.getName());
        
        logger.info("Fetching recent activities for admin dashboard");
        
        Map<String, Object> activities = new HashMap<>();
        
        try {
            activities.put("recentBookings", bookingRepository.findTop10ByOrderByCreatedAtDesc());
            activities.put("recentPayments", paymentRepository.findTop10ByOrderByCreatedAtDesc());
            activities.put("recentUsers", userRepository.findTop10ByOrderByCreatedAtDesc());
            
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            logger.error("Error fetching recent activities", e);
            activities.put("error", "Failed to fetch recent activities: " + e.getMessage());
            return ResponseEntity.internalServerError().body(activities);
        }
    }
    
    /**
     * Get all users for admin dashboard
     */
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        // Log authentication info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Admin users list accessed by: {}", auth.getName());
        
        logger.info("Fetching all users for admin dashboard");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all users from the repository
            response.put("users", userRepository.findAll());
            response.put("count", userRepository.count());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching users", e);
            response.put("error", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get all payment transactions for admin dashboard
     */
    @GetMapping("/payments")
    public ResponseEntity<Map<String, Object>> getAllPayments() {
        // Log authentication info
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        logger.info("Admin payments list accessed by: {}", auth.getName());
        
        logger.info("Fetching all payments for admin dashboard");
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get all payments from the repository
            response.put("payments", paymentRepository.findAll());
            response.put("count", paymentRepository.count());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching payments", e);
            response.put("error", "Failed to fetch payments: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 