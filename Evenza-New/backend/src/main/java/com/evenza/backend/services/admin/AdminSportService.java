package com.evenza.backend.services.admin;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evenza.backend.model.Sport;
import com.evenza.backend.repository.SportRepository;

@Service
public class AdminSportService {
    
    @Autowired
    private SportRepository sportRepository;
    
    public Page<Sport> getAllSports(Pageable pageable) {
        return sportRepository.findAll(pageable);
    }
    
    public Page<Sport> searchSports(String keyword, Pageable pageable) {
        return sportRepository.searchSports(keyword, pageable);
    }
    
    public Optional<Sport> getSportById(String id) {
        return sportRepository.findById(id);
    }
    
    @Transactional
    @CacheEvict(value = {"sports", "events"}, allEntries = true)
    public Sport createSport(Sport sport) {
        if (sport.getId() == null || sport.getId().isEmpty()) {
            String generatedId = UUID.randomUUID().toString();
            sport.setId(generatedId);
            System.out.println("Generated new ID for sport: " + generatedId);
        }
        
        // Always set category for proper classification
        sport.setCategory("SPORT");
        
        Sport savedSport = sportRepository.save(sport);
        System.out.println("Sport saved successfully with ID: " + savedSport.getId());
        return savedSport;
    }
    
    @Transactional
    @CacheEvict(value = {"sports", "events"}, allEntries = true)
    public Sport updateSport(String id, Sport sport) {
        sport.setId(id); // Ensure ID is set correctly
        
        // Always set category for proper classification
        sport.setCategory("SPORT");
        
        return sportRepository.save(sport);
    }
    
    @Transactional
    @CacheEvict(value = {"sports", "events"}, allEntries = true)
    public void deleteSport(String id) {
        sportRepository.deleteById(id);
    }
} 