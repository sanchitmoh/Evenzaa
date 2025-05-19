package com.evenza.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.Sports;
import com.evenza.backend.repository.SportsRepository;

@RestController
@RequestMapping("/api/sports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class SportsController {

    @Autowired
    private SportsRepository sportsRepository;

    // Get all sports
    @GetMapping
    public List<Sports> getAllSports() {
        return sportsRepository.findAll();
    }

    // Get sport by ID
    @GetMapping("/{id}")
    public ResponseEntity<Sports> getSportById(@PathVariable String id) {
        return sportsRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // Get sports by category
    @GetMapping("/category/{category}")
    public List<Sports> getSportsByCategory(@PathVariable String category) {
        return sportsRepository.findByCategoryIgnoreCase(category);
    }
}
