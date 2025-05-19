package com.evenza.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.evenza.backend.model.Booking;
import com.evenza.backend.repository.BookingRepository;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    private static final String USER_BOOKINGS_KEY_PREFIX = "USER_BOOKINGS:";
    private static final String ENTITY_BOOKINGS_KEY_PREFIX = "ENTITY_BOOKINGS:";
    private static final int RESERVATION_TIMEOUT_MINUTES = 15;
    
    public Booking createBooking(String seatId, String entityType, String entityId, 
                                String userId, String paymentId, BigDecimal amount) {
        Booking booking = new Booking();
        booking.setSeatId(seatId);
        booking.setEntityType(entityType);
        booking.setEntityId(entityId);
        booking.setUserId(userId);
        booking.setPaymentId(paymentId);
        booking.setAmount(amount.doubleValue());
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Update Redis cache - with error handling
        try {
            updateUserBookingsCache(userId);
            updateEntityBookingsCache(entityType, entityId);
        } catch (Exception e) {
            // Log the error but don't fail the booking creation
            System.err.println("Redis caching error (non-critical): " + e.getMessage());
        }
        
        return savedBooking;
    }
    
    public Booking createBooking(String seatId, String entityType, String entityId, 
                                String userId, String paymentId, BigDecimal amount, String venue) {
        Booking booking = new Booking();
        booking.setSeatId(seatId);
        booking.setEntityType(entityType);
        booking.setEntityId(entityId);
        booking.setUserId(userId);
        booking.setPaymentId(paymentId);
        booking.setAmount(amount.doubleValue());
        booking.setVenue(venue);
        
        Booking savedBooking = bookingRepository.save(booking);
        
        // Update Redis cache - with error handling
        try {
            updateUserBookingsCache(userId);
            updateEntityBookingsCache(entityType, entityId);
        } catch (Exception e) {
            // Log the error but don't fail the booking creation
            System.err.println("Redis caching error (non-critical): " + e.getMessage());
        }
        
        return savedBooking;
    }
    
    public List<Booking> createBookings(List<String> seatIds, String entityType, String entityId, 
                                        String userId, String paymentId, BigDecimal amount) {
        List<Booking> bookings = new ArrayList<>();
        
        System.out.println("Creating bookings for user ID: " + userId);
        System.out.println("Entity type: " + entityType + ", Entity ID: " + entityId);
        System.out.println("Seat IDs: " + String.join(", ", seatIds));
        
        // Calculate amount per seat
        BigDecimal amountPerSeat = amount.divide(BigDecimal.valueOf(Math.max(1, seatIds.size())), 2, BigDecimal.ROUND_HALF_UP);
        
        for (String seatId : seatIds) {
            Booking booking = new Booking();
            booking.setSeatId(seatId);
            booking.setEntityType(entityType);
            booking.setEntityId(entityId);
            booking.setUserId(userId);
            booking.setPaymentId(paymentId);
            booking.setAmount(amountPerSeat.doubleValue());
            
            bookings.add(booking);
        }
        
        try {
            List<Booking> savedBookings = bookingRepository.saveAll(bookings);
            System.out.println("Successfully saved " + savedBookings.size() + " bookings");
        
            // Update Redis cache - with error handling
            try {
                updateUserBookingsCache(userId);
                updateEntityBookingsCache(entityType, entityId);
            } catch (Exception e) {
                // Log the error but don't fail the booking creation
                System.err.println("Redis caching error (non-critical): " + e.getMessage());
            }
            
            return savedBookings;
        } catch (Exception e) {
            System.err.println("Error saving bookings: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<Booking> createBookings(List<String> seatIds, String entityType, String entityId, 
                                        String userId, String paymentId, BigDecimal amount, String venue) {
        List<Booking> bookings = new ArrayList<>();
        
        System.out.println("Creating bookings for user ID: " + userId);
        
        // Normalize entity type to uppercase
        entityType = entityType.toUpperCase();
        System.out.println("Entity type (normalized): " + entityType);
        System.out.println("Entity ID: " + entityId);
        System.out.println("Seat IDs: " + String.join(", ", seatIds));
        System.out.println("Venue: " + venue);
        
        // Calculate amount per seat
        BigDecimal amountPerSeat = amount.divide(BigDecimal.valueOf(Math.max(1, seatIds.size())), 2, BigDecimal.ROUND_HALF_UP);
        
        for (String seatId : seatIds) {
            Booking booking = new Booking();
            booking.setSeatId(seatId);
            booking.setEntityType(entityType);
            booking.setEntityId(entityId);
            booking.setUserId(userId);
            booking.setPaymentId(paymentId);
            booking.setAmount(amountPerSeat.doubleValue());
            booking.setVenue(venue);
            
            bookings.add(booking);
        }
        
        try {
            List<Booking> savedBookings = bookingRepository.saveAll(bookings);
            System.out.println("Successfully saved " + savedBookings.size() + " bookings");
        
            // Update Redis cache - with error handling
            try {
                updateUserBookingsCache(userId);
                updateEntityBookingsCache(entityType, entityId);
            } catch (Exception e) {
                // Log the error but don't fail the booking creation
                System.err.println("Redis caching error (non-critical): " + e.getMessage());
            }
            
            return savedBookings;
        } catch (Exception e) {
            System.err.println("Error saving bookings: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public List<Booking> getUserBookings(String userId) {
        System.out.println("Getting bookings for user ID: " + userId);
        
        String cacheKey = USER_BOOKINGS_KEY_PREFIX + userId;
        
        // Try to get from cache first - with error handling
        try {
            @SuppressWarnings("unchecked")
            List<Booking> cachedBookings = (List<Booking>) redisTemplate.opsForValue().get(cacheKey);
            
            if (cachedBookings != null) {
                System.out.println("Found " + cachedBookings.size() + " bookings in cache for user: " + userId);
                return cachedBookings;
            }
        } catch (Exception e) {
            System.err.println("Redis cache retrieval error (non-critical): " + e.getMessage());
            // Continue with database lookup on cache error
        }
        
        // If not in cache, get from database using both exact and partial match
        List<Booking> bookings = bookingRepository.findUserBookingsOrderByTimeDesc(userId);
        
        if (bookings.isEmpty()) {
            // Try with partial user ID matching if exact match returns empty results
            System.out.println("No bookings found with exact userId match, trying partial match for: " + userId);
            bookings = bookingRepository.findUserBookingsByPartialUserId(userId);
        }
        
        System.out.println("Found " + bookings.size() + " bookings in database for user: " + userId);
        
        // Cache the results - with error handling
        if (!bookings.isEmpty()) {
            try {
                redisTemplate.opsForValue().set(cacheKey, bookings, 1, TimeUnit.HOURS);
            } catch (Exception e) {
                System.err.println("Redis caching error (non-critical): " + e.getMessage());
            }
        }
        
        return bookings;
    }
    
    public List<Booking> getEntityBookings(String entityType, String entityId) {
        String cacheKey = ENTITY_BOOKINGS_KEY_PREFIX + entityType + ":" + entityId;
        
        // Try to get from cache first - with error handling
        try {
            @SuppressWarnings("unchecked")
            List<Booking> cachedBookings = (List<Booking>) redisTemplate.opsForValue().get(cacheKey);
            
            if (cachedBookings != null) {
                return cachedBookings;
            }
        } catch (Exception e) {
            System.err.println("Redis cache retrieval error (non-critical): " + e.getMessage());
            // Continue with database lookup on cache error
        }
        
        // If not in cache, get from database
        List<Booking> bookings = bookingRepository.findByEntityTypeAndEntityId(entityType, entityId);
        
        // Cache the results - with error handling
        try {
            redisTemplate.opsForValue().set(cacheKey, bookings, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            System.err.println("Redis caching error (non-critical): " + e.getMessage());
        }
        
        return bookings;
    }
    
    private void updateUserBookingsCache(String userId) {
        try {
            String cacheKey = USER_BOOKINGS_KEY_PREFIX + userId;
            List<Booking> bookings = bookingRepository.findUserBookingsOrderByTimeDesc(userId);
            redisTemplate.opsForValue().set(cacheKey, bookings, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            System.err.println("Error updating user bookings cache: " + e.getMessage());
            throw e; // Re-throw to be handled by the calling method
        }
    }
    
    private void updateEntityBookingsCache(String entityType, String entityId) {
        try {
            String cacheKey = ENTITY_BOOKINGS_KEY_PREFIX + entityType + ":" + entityId;
            List<Booking> bookings = bookingRepository.findByEntityTypeAndEntityId(entityType, entityId);
            redisTemplate.opsForValue().set(cacheKey, bookings, 1, TimeUnit.HOURS);
        } catch (Exception e) {
            System.err.println("Error updating entity bookings cache: " + e.getMessage());
            throw e; // Re-throw to be handled by the calling method
        }
    }
    
    public List<String> getBookedSeats() {
        return bookingRepository.findAll()
                .stream()
                .map(Booking::getSeatId)
                .toList();
    }
    
    public boolean existsBySeatId(String seatId) {
        return bookingRepository.existsBySeatId(seatId);
    }

    public Booking createTemporaryReservation(String seatId, String entityType, String entityId, 
                                            String userId, BigDecimal amount, String venue) {
        // Check if seat is already reserved or booked
        if (isSeatTaken(seatId, entityType, entityId)) {
            throw new RuntimeException("Seat is already taken");
        }

        Booking booking = new Booking();
        booking.setSeatId(seatId);
        booking.setEntityType(entityType);
        booking.setEntityId(entityId);
        booking.setUserId(userId);
        booking.setAmount(amount.doubleValue());
        booking.setVenue(venue);
        booking.setStatus("RESERVED");
        booking.setReservationExpiry(LocalDateTime.now().plusMinutes(RESERVATION_TIMEOUT_MINUTES));
        
        return bookingRepository.save(booking);
    }

    public List<Booking> createTemporaryReservations(List<String> seatIds, String entityType, String entityId, 
                                                    String userId, BigDecimal amount, String venue) {
        List<Booking> bookings = new ArrayList<>();
        
        // Check if any seat is already taken
        for (String seatId : seatIds) {
            if (isSeatTaken(seatId, entityType, entityId)) {
                throw new RuntimeException("Seat " + seatId + " is already taken");
            }
        }

        BigDecimal amountPerSeat = amount.divide(BigDecimal.valueOf(Math.max(1, seatIds.size())), 2, BigDecimal.ROUND_HALF_UP);
        
        for (String seatId : seatIds) {
            Booking booking = new Booking();
            booking.setSeatId(seatId);
            booking.setEntityType(entityType);
            booking.setEntityId(entityId);
            booking.setUserId(userId);
            booking.setAmount(amountPerSeat.doubleValue());
            booking.setVenue(venue);
            booking.setStatus("RESERVED");
            booking.setReservationExpiry(LocalDateTime.now().plusMinutes(RESERVATION_TIMEOUT_MINUTES));
            
            bookings.add(booking);
        }
        
        return bookingRepository.saveAll(bookings);
    }

    public void confirmReservation(String paymentId, List<Booking> bookings) {
        for (Booking booking : bookings) {
            booking.setStatus("CONFIRMED");
            booking.setPaymentId(paymentId);
            booking.setReservationExpiry(null);
        }
        bookingRepository.saveAll(bookings);
    }

    private boolean isSeatTaken(String seatId, String entityType, String entityId) {
        List<Booking> existingBookings = bookingRepository.findByEntityTypeAndEntityId(entityType, entityId);
        return existingBookings.stream()
            .filter(b -> b.getSeatId().equals(seatId))
            .anyMatch(b -> {
                if ("RESERVED".equals(b.getStatus())) {
                    // Check if reservation has expired
                    return b.getReservationExpiry() != null && 
                           b.getReservationExpiry().isAfter(LocalDateTime.now());
                }
                return "CONFIRMED".equals(b.getStatus());
            });
    }

    @Scheduled(fixedRate = 60000) // Run every minute
    public void cleanupExpiredReservations() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Booking> expiredReservations = allBookings.stream()
            .filter(b -> "RESERVED".equals(b.getStatus()) &&
                        b.getReservationExpiry() != null &&
                        b.getReservationExpiry().isBefore(LocalDateTime.now()))
            .collect(Collectors.toList());
        
        for (Booking booking : expiredReservations) {
            booking.setStatus("CANCELLED");
            booking.setReservationExpiry(null);
        }
        
        if (!expiredReservations.isEmpty()) {
            bookingRepository.saveAll(expiredReservations);
        }
    }
}
