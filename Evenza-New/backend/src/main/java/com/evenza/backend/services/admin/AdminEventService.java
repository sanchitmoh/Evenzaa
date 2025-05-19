package com.evenza.backend.services.admin;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evenza.backend.model.Event;
import com.evenza.backend.repository.EventRepository;

@Service
public class AdminEventService {
    
    @Autowired
    private EventRepository eventRepository;
    
    public Page<Event> getAllEvents(Pageable pageable) {
        return eventRepository.findAll(pageable);
    }
    
    public Page<Event> getEventsByCategory(String category, Pageable pageable) {
        return eventRepository.findByCategory(category, pageable);
    }
    
    public Page<Event> searchEvents(String keyword, Pageable pageable) {
        return eventRepository.searchEvents(keyword, pageable);
    }
    
    public Page<Event> searchEventsByCategory(String category, String keyword, Pageable pageable) {
        return eventRepository.searchEventsByCategory(category, keyword, pageable);
    }
    
    public Optional<Event> getEventById(String id) {
        return eventRepository.findById(id);
    }
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public Event createEvent(Event event) {
        if (event.getId() == null || event.getId().isEmpty()) {
            String generatedId = UUID.randomUUID().toString();
            event.setId(generatedId);
            System.out.println("Generated new ID for event: " + generatedId);
        }
        
        Event savedEvent = eventRepository.save(event);
        System.out.println("Event saved successfully with ID: " + savedEvent.getId());
        return savedEvent;
    }
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public Event updateEvent(String id, Event event) {
        event.setId(id); // Ensure ID is set correctly
        return eventRepository.save(event);
    }
    
    @Transactional
    @CacheEvict(value = "events", allEntries = true)
    public void deleteEvent(String id) {
        eventRepository.deleteById(id);
    }
} 