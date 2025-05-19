package com.evenza.backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evenza.backend.model.Concert;
import com.evenza.backend.repository.ConcertRepository;

@RestController
@RequestMapping("/api/concerts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"}) // Updated to match global config
public class ConcertController {

    @Autowired
    private ConcertRepository concertRepository;

    @GetMapping
    public List<Concert> getAllConcerts() {
        return concertRepository.findAll();
    }

    @GetMapping("/{id}")
    public Optional<Concert> getConcertById(@PathVariable String id) {
        return concertRepository.findById(id);
    }
}

