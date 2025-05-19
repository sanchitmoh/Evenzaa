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

import com.evenza.backend.model.Concert;
import com.evenza.backend.services.admin.AdminConcertService;

@RestController
@RequestMapping("/api/admin/concerts")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class AdminConcertController {
    
    @Autowired
    private AdminConcertService concertService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllConcerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Concert> concertPage;
        
        if (keyword != null && !keyword.isEmpty()) {
            concertPage = concertService.searchConcerts(keyword, pageRequest);
        } else {
            concertPage = concertService.getAllConcerts(pageRequest);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("concerts", concertPage.getContent());
        response.put("currentPage", concertPage.getNumber());
        response.put("totalItems", concertPage.getTotalElements());
        response.put("totalPages", concertPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getConcertById(@PathVariable String id) {
        return concertService.getConcertById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Concert> createConcert(@RequestBody Concert concert) {
        Concert savedConcert = concertService.createConcert(concert);
        return new ResponseEntity<>(savedConcert, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Concert> updateConcert(@PathVariable String id, @RequestBody Concert concert) {
        return ResponseEntity.ok(concertService.updateConcert(id, concert));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConcert(@PathVariable String id) {
        concertService.deleteConcert(id);
        return ResponseEntity.noContent().build();
    }
} 