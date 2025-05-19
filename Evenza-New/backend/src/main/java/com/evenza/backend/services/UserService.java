package com.evenza.backend.services;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.evenza.backend.model.Booking;
import com.evenza.backend.model.Payment;
import com.evenza.backend.model.User;
import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.PaymentRepository;
import com.evenza.backend.repository.UserRepository;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String DASHBOARD_CACHE_KEY_PREFIX = "USER_DASHBOARD:";
    private static final String USER_CACHE_KEY_PREFIX = "USER:";
    private static final long USER_CACHE_DURATION = 1; // hours
    // Register a new user with hashed password
    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
      User savedUser = userRepository.save(user);
        // Cache the user data in Redis
        cacheUserInRedis(savedUser);
        return savedUser;

    }
    private void cacheUserInRedis(User user) {
        // Create a copy of the user without sensitive data for caching
        User cacheUser = new User();
        cacheUser.setId(user.getId());
        cacheUser.setName(user.getName());
        cacheUser.setEmail(user.getEmail());
        cacheUser.setPassword(user.getPassword()); // Keep the encoded password
        cacheUser.setRole(user.getRole());
        cacheUser.setUid(user.getUid());
        cacheUser.setPhone(user.getPhone());
        cacheUser.setAddress(user.getAddress());
        cacheUser.setAvatar(user.getAvatar());

        // Cache by ID if available
        if (user.getId() != null) {
            String idCacheKey = USER_CACHE_KEY_PREFIX + user.getId();
            redisTemplate.opsForValue().set(idCacheKey, cacheUser, USER_CACHE_DURATION, TimeUnit.HOURS);
        }

        // Cache by UID if available
        if (user.getUid() != null && !user.getUid().isEmpty()) {
            String uidCacheKey = USER_CACHE_KEY_PREFIX + user.getUid();
            redisTemplate.opsForValue().set(uidCacheKey, cacheUser, USER_CACHE_DURATION, TimeUnit.HOURS);
        }

        // Cache by email
        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            String emailCacheKey = USER_CACHE_KEY_PREFIX + "EMAIL:" + user.getEmail();
            redisTemplate.opsForValue().set(emailCacheKey, cacheUser, USER_CACHE_DURATION, TimeUnit.HOURS);
        }
    }


    // Authenticate a user by email and password
    public Optional<User> authenticate(String email, String password) {
        // Try to get from Redis cache first
        String emailCacheKey = USER_CACHE_KEY_PREFIX + "EMAIL:" + email;
        Object cachedData = redisTemplate.opsForValue().get(emailCacheKey);

        if (cachedData != null) {
            User user;
            if (cachedData instanceof User) {
                user = (User) cachedData;
            } else if (cachedData instanceof Map) {
                // If it's a Map, convert it to a User object
                @SuppressWarnings("unchecked")
                Map<String, Object> userMap = (Map<String, Object>) cachedData;
                user = new User();
                user.setId(Integer.valueOf(userMap.get("id").toString()));
                user.setName((String) userMap.get("name"));
                user.setEmail((String) userMap.get("email"));
                user.setPassword((String) userMap.get("password"));
                user.setRole(User.Role.valueOf((String) userMap.get("role")));
                user.setUid((String) userMap.get("uid"));
                user.setPhoneNumber((String) userMap.get("phoneNumber"));
                user.setAddress((String) userMap.get("address"));
                user.setProfileImageUrl((String) userMap.get("profileImageUrl"));
                user.setProfileImagePublicId((String) userMap.get("profileImagePublicId"));
            } else {
                user = null;
            }

            if (user != null && passwordEncoder.matches(password, user.getPassword())) {
                return Optional.of(user);
            }
        }

        // If not in cache or password doesn't match, try database
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && passwordEncoder.matches(password, userOpt.get().getPassword())) {
            // Cache the user for future requests
            cacheUserInRedis(userOpt.get());
            return userOpt;
        }

        return Optional.empty();
    }

    // Find a user by email
    public Optional<User> findByEmail(String email) {
        // Try to get from Redis cache first
        String emailCacheKey = USER_CACHE_KEY_PREFIX + "EMAIL:" + email;
        Object cachedData = redisTemplate.opsForValue().get(emailCacheKey);

        if (cachedData != null) {
            if (cachedData instanceof User) {
                return Optional.of((User) cachedData);
            }
        }

        // If not in cache or invalid data type, get from database
        Optional<User> userOpt = userRepository.findByEmail(email);

        // Cache the user if found
        userOpt.ifPresent(this::cacheUserInRedis);
        return userOpt;
    }

    // Find a user by ID
    public Optional<User> findByUid(String uid) {
        // Try to get from Redis cache first
        String uidCacheKey = USER_CACHE_KEY_PREFIX + uid;
        Object cachedData = redisTemplate.opsForValue().get(uidCacheKey);

        if (cachedData != null) {
            if (cachedData instanceof User) {
                return Optional.of((User) cachedData);
            }
        }

        // If not in cache or invalid data type, get from database
        Optional<User> userOpt = userRepository.findByUid(uid);

        // Cache the user if found
        userOpt.ifPresent(this::cacheUserInRedis);
        return userOpt;
    }

    // Get user dashboard data
    public Map<String, Object> getUserDashboardData(String userId) {
        // Try to get from Redis cache first
        String cacheKey = DASHBOARD_CACHE_KEY_PREFIX + userId;
        @SuppressWarnings("unchecked")
        Map<String, Object> cachedData = (Map<String, Object>) redisTemplate.opsForValue().get(cacheKey);

        if (cachedData != null) {
            return cachedData;
        }

        // If not in cache, compute dashboard data
        Map<String, Object> dashboardData = new HashMap<>();

        try {
            // Get user bookings
            List<Booking> bookings = bookingRepository.findUserBookingsOrderByTimeDesc(userId);

            // Get user payments
            List<Payment> payments = paymentRepository.findByUserId(userId);

            // Calculate stats
            LocalDateTime now = LocalDateTime.now();

            // Upcoming events (bookings with future dates and CONFIRMED status)
            List<Booking> upcomingEvents = bookings.stream()
                    .filter(b -> b.getBookingTime().isAfter(now) && "CONFIRMED".equals(b.getStatus()))
                    .collect(Collectors.toList());

            // Past events (bookings with past dates or non-CONFIRMED status)
            List<Booking> pastEvents = bookings.stream()
                    .filter(b -> b.getBookingTime().isBefore(now) || !"CONFIRMED".equals(b.getStatus()))
                    .collect(Collectors.toList());

            // Calculate total spent
            BigDecimal totalSpent = BigDecimal.ZERO;
            for (Payment payment : payments) {
                if ("SUCCESS".equals(payment.getStatus())) {
                    totalSpent = totalSpent.add(BigDecimal.valueOf(payment.getAmount()));
                }
            }

            // Get recent payments
            List<Payment> recentPayments = payments.stream()
                    .sorted((p1, p2) -> p2.getCreatedAt().compareTo(p1.getCreatedAt()))
                    .limit(5)
                    .collect(Collectors.toList());

            // Get count of distinct event types
            long eventTypesCount = bookings.stream()
                    .map(Booking::getEntityType)
                    .distinct()
                    .count();

            // Count of bookings by event type
            Map<String, Long> bookingsByType = bookings.stream()
                    .collect(Collectors.groupingBy(
                            Booking::getEntityType,
                            Collectors.counting()));

            // Populate dashboard data
            dashboardData.put("upcomingEventsCount", upcomingEvents.size());
            dashboardData.put("pastEventsCount", pastEvents.size());
            dashboardData.put("totalSpent", totalSpent);
            dashboardData.put("upcomingEvents", upcomingEvents);
            dashboardData.put("recentPayments", recentPayments);
            dashboardData.put("eventTypesCount", eventTypesCount);
            dashboardData.put("bookingsByType", bookingsByType);

            // Cache the dashboard data
            redisTemplate.opsForValue().set(cacheKey, dashboardData, 30, TimeUnit.MINUTES);
        } catch (Exception e) {
            // If there's an error, return empty dashboard data
            dashboardData.put("upcomingEventsCount", 0);
            dashboardData.put("pastEventsCount", 0);
            dashboardData.put("totalSpent", BigDecimal.ZERO);
            dashboardData.put("upcomingEvents", Collections.emptyList());
            dashboardData.put("recentPayments", Collections.emptyList());
            dashboardData.put("eventTypesCount", 0);
            dashboardData.put("bookingsByType", Collections.emptyMap());

            // Log the error
            e.printStackTrace();
        }

        return dashboardData;
    }

    public boolean existsByEmail(@NotBlank @Size(max = 50) @Email String email) {
        return userRepository.existsByEmail(email);
    }

    public User updateUser(User user) {
        // Update the user in the database
        User updatedUser = userRepository.save(user);

        // Cache the updated user data
        cacheUserInRedis(updatedUser);

        return updatedUser;
    }

    public User getUserById(String userId) {
        // Try to get from Redis cache first
        String cacheKey = USER_CACHE_KEY_PREFIX + userId;
        Object cachedData = redisTemplate.opsForValue().get(cacheKey);

        if (cachedData != null) {
            if (cachedData instanceof User) {
                return (User) cachedData;
            } else if (cachedData instanceof Map) {
                // If it's a Map, convert it to a User object
                @SuppressWarnings("unchecked")
                Map<String, Object> userMap = (Map<String, Object>) cachedData;
                User user = new User();
                user.setId(Integer.valueOf(userMap.get("id").toString()));
                user.setName((String) userMap.get("name"));
                user.setEmail((String) userMap.get("email"));
                user.setPassword((String) userMap.get("password"));
                user.setRole(User.Role.valueOf((String) userMap.get("role")));
                user.setUid((String) userMap.get("uid"));
                user.setPhoneNumber((String) userMap.get("phoneNumber"));
                user.setAddress((String) userMap.get("address"));
                user.setProfileImageUrl((String) userMap.get("profileImageUrl"));
                user.setProfileImagePublicId((String) userMap.get("profileImagePublicId"));
                return user;
            }
        }

        // If not in cache or invalid data type, get from database
        Optional<User> userOpt = userRepository.findById(Long.valueOf(userId));

        // Cache the user if found
        userOpt.ifPresent(this::cacheUserInRedis);
        return userOpt.orElse(null);
    }
}

 
