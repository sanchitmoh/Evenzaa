package com.evenza.backend.services.admin;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evenza.backend.model.Concert;
import com.evenza.backend.repository.ConcertRepository;

@Service
public class AdminConcertService {
    
    @Autowired
    private ConcertRepository concertRepository;
    
    public Page<Concert> getAllConcerts(Pageable pageable) {
        return concertRepository.findAll(pageable);
    }
    
    public Page<Concert> searchConcerts(String keyword, Pageable pageable) {
        return concertRepository.searchConcerts(keyword, pageable);
    }
    
    public Optional<Concert> getConcertById(String id) {
        return concertRepository.findById(id);
    }
    
    @Transactional
    @CacheEvict(value = {"concerts", "events"}, allEntries = true)
    public Concert createConcert(Concert concert) {
        if (concert.getId() == null || concert.getId().isEmpty()) {
            String generatedId = UUID.randomUUID().toString();
            concert.setId(generatedId);
            System.out.println("Generated new ID for concert: " + generatedId);
        }
        
        // Always set category for proper classification
        concert.setCategory("CONCERT");
        
        Concert savedConcert = concertRepository.save(concert);
        System.out.println("Concert saved successfully with ID: " + savedConcert.getId());
        return savedConcert;
    }
    
    @Transactional
    @CacheEvict(value = {"concerts", "events"}, allEntries = true)
    public Concert updateConcert(String id, Concert concert) {
        concert.setId(id); // Ensure ID is set correctly
        
        // Always set category for proper classification
        concert.setCategory("CONCERT");
        
        return concertRepository.save(concert);
    }
    
    @Transactional
    @CacheEvict(value = {"concerts", "events"}, allEntries = true)
    public void deleteConcert(String id) {
        concertRepository.deleteById(id);
    }
} 