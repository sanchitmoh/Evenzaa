package com.evenza.backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.Booking;
import com.evenza.backend.model.Movie;
import com.evenza.backend.model.Ticket;
import com.evenza.backend.repository.BookingRepository;
import com.evenza.backend.repository.MovieRepository;
import com.evenza.backend.repository.TicketRepository;
import com.evenza.backend.services.PaymentService;
import com.evenza.backend.services.TicketService;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Value("${app.base.url:http://localhost:8080}")
    private String baseUrl;

    @Autowired
    private TicketService ticketService;
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private TicketRepository ticketRepository;
    
    @Autowired
    private MovieRepository movieRepository;
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/generate")
    public ResponseEntity<?> generateTicket(@RequestBody Map<String, String> ticketData) {
        System.out.println("Received ticket generation request: " + ticketData);
        
        try {
            String bookingId = ticketData.get("bookingId");
            String entityName = ticketData.get("entityName");
            String venue = ticketData.get("venue");
            
            if (bookingId == null || bookingId.isEmpty()) {
                return ResponseEntity.badRequest().body("Booking ID is required");
            }
            
            // Handle different date formats with enhanced parsing
            String eventDateTimeStr = ticketData.get("eventDateTime");
            ZonedDateTime eventDateTime = null;
            
            if (eventDateTimeStr != null && !eventDateTimeStr.isEmpty()) {
                try {
                    // Try to parse as ISO format with timezone
                    if (eventDateTimeStr.endsWith("Z")) {
                        // Handle Z timezone marker
                        Instant instant = Instant.parse(eventDateTimeStr);
                        eventDateTime = instant.atZone(java.time.ZoneId.systemDefault());
                    } else {
                        eventDateTime = ZonedDateTime.parse(eventDateTimeStr);
                    }
                } catch (Exception e) {
                    System.out.println("Failed to parse date: " + eventDateTimeStr + " - " + e.getMessage());
                    
                    try {
                        // Try as ISO local date-time format
                        LocalDateTime localDateTime = LocalDateTime.parse(eventDateTimeStr);
                        eventDateTime = localDateTime.atZone(java.time.ZoneId.systemDefault());
                    } catch (Exception e2) {
                        // Set a default future date for the event
                        System.out.println("Could not parse date in any format, using future date: " + e2.getMessage());
                        LocalDateTime futureDate = LocalDateTime.now().plusDays(7);
                        eventDateTime = futureDate.atZone(java.time.ZoneId.systemDefault());
                    }
                }
            } else {
                // Default to a date 7 days in the future
                LocalDateTime futureDate = LocalDateTime.now().plusDays(7);
                eventDateTime = futureDate.atZone(java.time.ZoneId.systemDefault());
            }
            
            // Get the booking from the database
            Optional<Booking> bookingOptional = bookingRepository.findById(Long.parseLong(bookingId));
            
            if (bookingOptional.isEmpty()) {
                System.out.println("Booking not found: " + bookingId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Booking not found: " + bookingId);
            }
            
            Booking booking = bookingOptional.get();
            
            // Determine entity type from booking
            String entityType = booking.getEntityType() != null ? booking.getEntityType() : 
                              (ticketData.containsKey("entityType") ? ticketData.get("entityType") : "CONCERT");
            
            // If entity name not provided, create one based on entity type
            if (entityName == null || entityName.isEmpty()) {
                switch (entityType) {
                    case "MOVIE":
                        entityName = "Movie Ticket";
                        break;
                    case "SPORTS":
                        entityName = "Sports Event";
                        break;
                    case "CONCERT":
                        entityName = "Concert";
                        break;
                    default:
                        entityName = "Event Ticket";
                }
            }
            
            // If venue not provided, create one based on entity type
            if (venue == null || venue.isEmpty()) {
                switch (entityType) {
                    case "MOVIE":
                        venue = "Evenza Cinema";
                        break;
                    case "SPORTS":
                        venue = "Evenza Stadium";
                        break;
                    case "CONCERT":
                        venue = "Evenza Concert Hall";
                        break;
                    default:
                        venue = "Evenza Venue";
                }
            }
            
            // Generate the ticket
            Ticket ticket = ticketService.generateTicket(booking.getId().toString(), entityName, venue, eventDateTime.toLocalDateTime());
            
            if (ticket != null) {
                // If ticket is for movies, use Movie Name in the ticket
                if ("MOVIE".equals(entityType)) {
                    try {
                        Optional<Movie> movie = movieRepository.findById(booking.getEntityId());
                        if (movie.isPresent()) {
                            ticket.setEntityName(movie.get().getTitle());
                            ticketRepository.save(ticket);
                        }
                    } catch (Exception e) {
                        System.out.println("Could not update movie name in ticket: " + e.getMessage());
                    }
                }
                
                // Format baseUrl to ensure proper forward slashes
                String formattedBaseUrl = baseUrl.replace("\\", "/");
                if (formattedBaseUrl.endsWith("/")) {
                    formattedBaseUrl = formattedBaseUrl.substring(0, formattedBaseUrl.length() - 1);
                }
                
                return ResponseEntity.ok(Map.of(
                    "pdfUrl", formattedBaseUrl + "/api/tickets/download/" + ticket.getId(),
                    "message", "Ticket generated successfully",
                    "ticketId", ticket.getId()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Failed to generate ticket");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error generating ticket: " + e.getMessage());
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getUserTickets(@PathVariable String userId) {
        List<Ticket> tickets = ticketService.getUserTickets(userId);
        return ResponseEntity.ok(tickets);
    }
    
    @GetMapping("/user/{userId}/upcoming")
    public ResponseEntity<List<Ticket>> getUpcomingTickets(@PathVariable String userId) {
        List<Ticket> tickets = ticketService.getUpcomingTicketsByUserId(userId);
        return ResponseEntity.ok(tickets);
    }
    
    @GetMapping("/user/{userId}/past")
    public ResponseEntity<List<Ticket>> getPastTickets(@PathVariable String userId) {
        List<Ticket> tickets = ticketService.getPastTicketsByUserId(userId);
        return ResponseEntity.ok(tickets);
    }
    
    @GetMapping("/{ticketId}")
    public ResponseEntity<?> getTicket(@PathVariable String ticketId) {
        Optional<Ticket> ticketOpt = ticketService.getTicketById(ticketId);
        
        if (ticketOpt.isPresent()) {
            return ResponseEntity.ok(ticketOpt.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/download/{ticketId}")
    public ResponseEntity<?> downloadTicket(
            @PathVariable String ticketId,
            @RequestParam(required = false) String token) {
        
        // If token is provided in query parameter, use it for authentication
        if (token != null && !token.isEmpty()) {
            // Log the token presence for debugging
            System.out.println("Token provided via query parameter for ticket download: " + ticketId);
            // Note: The actual authentication should be handled by Spring Security filters
            // This is just for logging purposes
        }
        
        Optional<Ticket> ticketOpt = ticketService.getTicketById(ticketId);
        
        if (ticketOpt.isPresent()) {
            String pdfPath = ticketService.getTicketPdfPath(ticketId);
            if (pdfPath != null) {
                try {
                    Path path = Paths.get(pdfPath);
                    ByteArrayResource resource = new ByteArrayResource(Files.readAllBytes(path));
                    
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ticket_" + ticketId + ".pdf")
                            .contentType(MediaType.APPLICATION_PDF)
                            .body(resource);
                } catch (IOException e) {
                    e.printStackTrace();
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body("Error reading the ticket PDF file: " + e.getMessage());
                }
            } else {
                // If PDF doesn't exist, generate it on-the-fly
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("PDF file not found for ticket: " + ticketId);
            }
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Ticket not found for ID: " + ticketId);
        }
    }
    
    @PostMapping("/validate/{ticketId}")
    public ResponseEntity<?> validateTicket(@PathVariable String ticketId) {
        boolean isValid = ticketService.validateTicket(ticketId);
        
        if (isValid) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "Ticket is valid"));
        } else {
            return ResponseEntity.ok(Map.of("valid", false, "message", "Ticket is invalid or has already been used"));
        }
    }
    
    // Generate tickets for an existing booking (triggered after payment success)
    @PostMapping("/generate-from-booking/{bookingId}")
    public ResponseEntity<?> generateTicketsFromBooking(
            @PathVariable String bookingId,
            @RequestBody Map<String, Object> eventDetails) {
        
        try {
            String entityName = eventDetails.get("entityName").toString();
            String venue = eventDetails.get("venue").toString();
            
            // Parse event date time - handling ISO format with timezone
            String dateTimeStr = eventDetails.get("eventDateTime").toString();
            System.out.println("Received date string from booking: " + dateTimeStr); // Debug log
            
            LocalDateTime eventDateTime;
            try {
                if (dateTimeStr.endsWith("Z")) {
                    // Parse ISO 8601 format with 'Z' (UTC timezone)
                    Instant instant = Instant.parse(dateTimeStr);
                    eventDateTime = LocalDateTime.ofInstant(instant, java.time.ZoneId.systemDefault());
                } else if (dateTimeStr.contains("+") || dateTimeStr.contains("-")) {
                    // Handle other timezone formats
                    ZonedDateTime zonedDateTime = ZonedDateTime.parse(dateTimeStr);
                    eventDateTime = zonedDateTime.toLocalDateTime();
                } else {
                    // Standard ISO LocalDateTime format without timezone
                    eventDateTime = LocalDateTime.parse(dateTimeStr);
                }
            } catch (Exception e) {
                System.err.println("Date parsing error in booking: " + e.getMessage());
                // Fallback to a future date if parsing fails
                eventDateTime = LocalDateTime.now().plusDays(7);
            }
            
            Ticket ticket = ticketService.generateTicket(bookingId, entityName, venue, eventDateTime);
            
            return ResponseEntity.ok(Map.of(
                "message", "Ticket generated successfully", 
                "ticketId", ticket.getId(),
                "pdfUrl", ticket.getPdfUrl()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate ticket: " + e.getMessage()));
        }
    }
    
    @GetMapping("/status/booking/{bookingId}")
    public ResponseEntity<?> checkTicketGenerationStatus(@PathVariable String bookingId) {
        try {
            // Convert bookingId to Long for validation
            try {
                Long.parseLong(bookingId);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid booking ID format",
                    "status", "ERROR"
                ));
            }
            
            // Get status from Redis via PaymentService
            Map<String, Object> status = paymentService.getTicketGenerationStatus(bookingId);
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Error checking ticket status: " + e.getMessage(),
                "status", "ERROR"
            ));
        }
    }
} 