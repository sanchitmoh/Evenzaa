package com.evenza.backend.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.Event;
import com.evenza.backend.services.admin.AdminEventService;

@RestController
@RequestMapping("/api/admin/events")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class AdminEventController {
    
    @Autowired
    private AdminEventService eventService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Event> eventPage;
        
        // Determine which finder method to use based on provided parameters
        if (category != null && !category.isEmpty() && keyword != null && !keyword.isEmpty()) {
            eventPage = eventService.searchEventsByCategory(category, keyword, pageRequest);
        } else if (category != null && !category.isEmpty()) {
            eventPage = eventService.getEventsByCategory(category, pageRequest);
        } else if (keyword != null && !keyword.isEmpty()) {
            eventPage = eventService.searchEvents(keyword, pageRequest);
        } else {
            eventPage = eventService.getAllEvents(pageRequest);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("events", eventPage.getContent());
        response.put("currentPage", eventPage.getNumber());
        response.put("totalItems", eventPage.getTotalElements());
        response.put("totalPages", eventPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getEventById(@PathVariable String id) {
        return eventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        Event savedEvent = eventService.createEvent(event);
        return new ResponseEntity<>(savedEvent, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(@PathVariable String id, @RequestBody Event event) {
        return ResponseEntity.ok(eventService.updateEvent(id, event));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
    
    // Handle DELETE requests with trailing slash (no ID)
    @DeleteMapping("/")
    public ResponseEntity<Void> handleEmptyDeleteRequest() {
        return ResponseEntity
            .badRequest()
            .header("X-Error-Message", "Event ID is required for deletion")
            .build();
    }
} 