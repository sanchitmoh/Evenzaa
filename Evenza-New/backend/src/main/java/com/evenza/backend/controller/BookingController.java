package com.evenza.backend.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.Booking;
import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.ConcertRepository;
import com.evenza.backend.repository.EventRepository;
import com.evenza.backend.repository.MovieRepository;
import com.evenza.backend.repository.SportRepository;
import com.evenza.backend.services.BookingService;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private ConcertRepository concertRepository;
    
    @Autowired
    private SportRepository sportRepository;
    
    @Autowired
    private EventRepository eventRepository;

    @GetMapping
    public List<String> getBookedSeats() {
        return bookingService.getBookedSeats();
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookSeats(@RequestBody Map<String, Object> bookingData) {
        try {
            System.out.println("Received booking request: " + bookingData);
            
            @SuppressWarnings("unchecked")
            List<String> seatIds = (List<String>) bookingData.get("seatIds");
            String entityType = (String) bookingData.get("entityType");
            String entityId = (String) bookingData.get("entityId");
            
            // Fix the userId casting issue by handling multiple types
            String userId;
            Object userIdObj = bookingData.get("userId");
            if (userIdObj instanceof String) {
                userId = (String) userIdObj;
            } else if (userIdObj instanceof Number) {
                userId = userIdObj.toString();
            } else if (userIdObj == null) {
                System.err.println("Missing userId in booking request");
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            } else {
                userId = String.valueOf(userIdObj);
            }
            
            String paymentId = (String) bookingData.get("paymentId");
            Object amountObj = bookingData.get("amount");
            String venue = (String) bookingData.get("venue");
            
            System.out.println("User ID from request: " + userId);
            
            if (userId == null || userId.isEmpty()) {
                System.err.println("Empty userId in booking request");
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            }
            
            BigDecimal amount;
            try {
                if (amountObj instanceof Number) {
                    amount = new BigDecimal(amountObj.toString());
                } else if (amountObj instanceof String) {
                    amount = new BigDecimal((String) amountObj);
                } else {
                    throw new NumberFormatException("Amount is not a valid number");
                }
            } catch (NumberFormatException e) {
                System.err.println("Invalid amount format: " + amountObj);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount format"));
            }

            if (seatIds == null || seatIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No seats selected"));
            }

            // Set default venue based on entity type if not provided
            if (venue == null || venue.isEmpty()) {
                switch (entityType) {
                    case "MOVIE":
                        venue = "Evenza Cinema";
                        break;
                    case "THEATER":
                        venue = "Evenza Theater";
                        break;
                    case "CONCERT":
                        venue = "Evenza Concert Hall";
                        break;
                    case "SPORTS":
                    case "SPORT":
                        venue = "Evenza Stadium";
                        break;
                    default:
                        venue = "Evenza Venue";
                        break;
                }
            }

            // Create bookings
            List<Booking> bookings = bookingService.createBookings(
                    seatIds, entityType, entityId, userId, paymentId, amount, venue);

            return ResponseEntity.ok(Map.of(
                "message", "Booking successful",
                "bookings", bookings
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Booking failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/confirm")
    public ResponseEntity<?> confirmBooking(@RequestBody Map<String, Object> confirmData) {
        try {
            System.out.println("Received booking confirmation: " + confirmData);
            
            // Extract seats from the request
            @SuppressWarnings("unchecked")
            List<String> seats = (List<String>) confirmData.get("seatIds");
            if (seats == null) {
                seats = (List<String>) confirmData.get("seats");
            }

            // Extract entity information
            String entityType;
            if (confirmData.containsKey("entityType")) {
                // Normalize entity type to uppercase and handle special cases
                String rawEntityType = ((String) confirmData.get("entityType")).toUpperCase();
                // Map special cases to standard types
                switch (rawEntityType) {
                    case "HORSE RACING":
                    case "HORSERACING":
                        entityType = "SPORT";
                        break;
                    case "THEATER":
                    case "MOVIE":
                        entityType = rawEntityType; // Keep THEATER and MOVIE as separate types
                        break;
                    default:
                        entityType = rawEntityType;
                }
            } else if (confirmData.containsKey("sportId")) {
                entityType = "SPORT";
            } else if (confirmData.containsKey("concertId")) {
                entityType = "CONCERT";
            } else if (confirmData.containsKey("eventId")) {
                entityType = "EVENT";
            } else if (confirmData.containsKey("movieId")) {
                entityType = "MOVIE";
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Entity type is required"));
            }
            
            // Add debug logging for entity type
            System.out.println("Entity type normalized to: " + entityType);
            
            // Get entity ID
            String entityId;
            if (confirmData.containsKey("entityId")) {
                entityId = (String) confirmData.get("entityId");
            } else if (confirmData.containsKey("sportId")) {
                entityId = (String) confirmData.get("sportId");
            } else if (confirmData.containsKey("concertId")) {
                entityId = (String) confirmData.get("concertId");
            } else if (confirmData.containsKey("eventId")) {
                entityId = (String) confirmData.get("eventId");
            } else if (confirmData.containsKey("movieId")) {
                entityId = (String) confirmData.get("movieId");
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Entity ID is required"));
            }

            // Verify that the entity exists before creating bookings
            boolean entityExists = false;
            try {
                switch (entityType) {
                    case "MOVIE":
                        entityExists = movieRepository.findById(entityId).isPresent();
                        System.out.println("Movie check result: " + entityExists);
                        break;
                    case "CONCERT":
                        entityExists = concertRepository.findById(entityId).isPresent();
                        System.out.println("Concert check result: " + entityExists);
                        break;
                    case "SPORT":
                    case "SPORTS": // Handle both variations
                        entityExists = sportRepository.findById(entityId).isPresent();
                        System.out.println("Sport check result: " + entityExists);
                        break;
                    case "EVENT":
                        entityExists = eventRepository.findById(entityId).isPresent();
                        System.out.println("Event check result: " + entityExists);
                        break;
                    default:
                        // Try checking all repositories as fallback
                        entityExists = movieRepository.findById(entityId).isPresent() ||
                                      concertRepository.findById(entityId).isPresent() ||
                                      sportRepository.findById(entityId).isPresent() ||
                                      eventRepository.findById(entityId).isPresent();
                        System.out.println("Fallback check result: " + entityExists);
                }
            } catch (Exception e) {
                System.err.println("Error checking if entity exists: " + e.getMessage());
                e.printStackTrace();
                // Continue with booking - don't block on repository check error
                entityExists = true;
            }
            
            if (!entityExists) {
                System.err.println("Entity not found: " + entityType + " with ID: " + entityId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "The " + entityType.toLowerCase() + " you're trying to book doesn't exist"));
            }
            
            // Fix the userId casting issue
            String userId;
            Object userIdObj = confirmData.get("userId");
            if (userIdObj instanceof String) {
                userId = (String) userIdObj;
            } else if (userIdObj instanceof Number) {
                userId = userIdObj.toString();
            } else if (userIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            } else {
                userId = String.valueOf(userIdObj);
            }
            
            String paymentId = (String) confirmData.get("paymentId");
            
            // Find amount or use default
            BigDecimal amount = BigDecimal.ZERO;
            if (confirmData.containsKey("amount")) {
                Object amountObj = confirmData.get("amount");
                if (amountObj instanceof Number) {
                    amount = new BigDecimal(amountObj.toString());
                } else if (amountObj instanceof String) {
                    amount = new BigDecimal((String) amountObj);
                }
            } else {
                // Default amount based on entity type
                amount = switch(entityType) {
                    case "CONCERT" -> new BigDecimal("3000");  // Default concert price
                    case "SPORTS" -> new BigDecimal("2000");   // Default sports price
                    case "EVENT" -> new BigDecimal("1500");    // Default event price
                    case "MOVIE" -> new BigDecimal("300");     // Default movie price
                    default -> new BigDecimal("1000");         // Default price
                };
            }
            
            if (seats == null || seats.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No seats selected"));
            }

            // Set default venue based on entity type if not provided
            String venue = null;
            if (entityType.equals("MOVIE") || entityType.equals("THEATER")) {
                venue = "Evenza Cinema";
            } else if (entityType.equals("CONCERT")) {
                venue = "Evenza Concert Hall";
            } else if (entityType.equals("SPORTS") || entityType.equals("SPORT")) {
                venue = "Evenza Stadium";
            }

            // Create bookings
            List<Booking> bookings = bookingService.createBookings(
                    seats, entityType, entityId, userId, paymentId, amount, venue);

            return ResponseEntity.ok(Map.of(
                "message", "Booking confirmed successfully",
                "bookings", bookings
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Booking confirmation failed: " + e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(@PathVariable String userId) {
        try {
            List<Booking> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch user bookings: " + e.getMessage()));
        }
    }

    @GetMapping("/current-user")
    public ResponseEntity<?> getCurrentUserBookings(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract user ID from auth token
            String userId = extractUserIdFromToken(authHeader);

            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "User not authenticated"));
            }

            List<Booking> bookings = bookingService.getUserBookings(userId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch user bookings: " + e.getMessage()));
        }
    }

    // Update token extraction logic to properly get user ID from JWT token
    private String extractUserIdFromToken(String authHeader) {
        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                
                // Use your JwtTokenProvider or equivalent to parse the token
                // This is a simplified version - use your actual JWT parsing logic
                org.springframework.security.core.Authentication auth = 
                    org.springframework.security.authentication.UsernamePasswordAuthenticationToken
                        .authenticated(null, null, null);
                
                // Get the principal from SecurityContextHolder if available
                Object principal = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication().getPrincipal();
                
                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                } else if (principal instanceof java.util.Map) {
                    // If using JWT with claims map
                    return ((java.util.Map<?,?>) principal).get("sub").toString();
                } else if (principal != null) {
                    return principal.toString();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @GetMapping("/entity")
    public ResponseEntity<?> getEntityBookings(
            @RequestParam String entityType,
            @RequestParam String entityId) {
        try {
            List<Booking> bookings = bookingService.getEntityBookings(entityType, entityId);
            return ResponseEntity.ok(bookings);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch entity bookings: " + e.getMessage()));
        }
    }

    @PostMapping("/reserve")
    public ResponseEntity<?> reserveSeats(@RequestBody Map<String, Object> reservationData) {
        try {
            @SuppressWarnings("unchecked")
            List<String> seatIds = (List<String>) reservationData.get("seatIds");
            String entityType = (String) reservationData.get("entityType");
            String entityId = (String) reservationData.get("entityId");
            String userId = (String) reservationData.get("userId");
            Object amountObj = reservationData.get("amount");
            String venue = (String) reservationData.get("venue");
            
            if (userId == null || userId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "User ID is required"));
            }
            
            BigDecimal amount;
            try {
                if (amountObj instanceof Number) {
                    amount = new BigDecimal(amountObj.toString());
                } else if (amountObj instanceof String) {
                    amount = new BigDecimal((String) amountObj);
                } else {
                    throw new NumberFormatException("Amount is not a valid number");
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid amount format"));
            }

            List<Booking> reservations = bookingService.createTemporaryReservations(
                seatIds, entityType, entityId, userId, amount, venue);

            return ResponseEntity.ok(Map.of(
                "message", "Seats reserved successfully",
                "reservations", reservations
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Reservation failed: " + e.getMessage()));
        }
    }

    @PostMapping("/confirm-reservation")
    public ResponseEntity<?> confirmReservation(@RequestBody Map<String, Object> confirmData) {
        try {
            String paymentId = (String) confirmData.get("paymentId");
            @SuppressWarnings("unchecked")
            List<String> reservationIds = (List<String>) confirmData.get("reservationIds");
            
            if (paymentId == null || paymentId.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment ID is required"));
            }
            
            if (reservationIds == null || reservationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reservation IDs are required"));
            }
            
            List<Booking> bookings = reservationIds.stream()
                .map(id -> bookingRepository.findById(Long.parseLong(id)))
                .filter(Optional::isPresent)
                .<Booking>map(Optional::get)
                .collect(Collectors.toList());
            
            bookingService.confirmReservation(paymentId, bookings);
            
            return ResponseEntity.ok(Map.of(
                "message", "Reservations confirmed successfully",
                "bookings", bookings
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Confirmation failed: " + e.getMessage()));
        }
    }
}

