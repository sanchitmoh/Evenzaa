package com.evenza.backend.services;

import com.evenza.backend.model.Event;
import com.evenza.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    public List<Event> getEvents(String search) {
        if (search != null) {
            return eventRepository.searchByKeyword(search); // Search by keyword (title or description)
        } else {
            return eventRepository.findAll(); // Return all events if no search query is provided
        }
    }
}