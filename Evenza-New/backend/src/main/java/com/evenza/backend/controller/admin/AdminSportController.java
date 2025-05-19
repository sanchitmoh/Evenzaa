package com.evenza.backend.controller.admin;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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

import com.evenza.backend.model.Sport;
import com.evenza.backend.services.admin.AdminSportService;

@RestController
@RequestMapping("/api/admin/sports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class AdminSportController {
    
    @Autowired
    private AdminSportService sportService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllSports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword) {
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
        
        Page<Sport> sportPage;
        
        if (keyword != null && !keyword.isEmpty()) {
            sportPage = sportService.searchSports(keyword, pageRequest);
        } else {
            sportPage = sportService.getAllSports(pageRequest);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("sports", sportPage.getContent());
        response.put("currentPage", sportPage.getNumber());
        response.put("totalItems", sportPage.getTotalElements());
        response.put("totalPages", sportPage.getTotalPages());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getSportById(@PathVariable String id) {
        UUID uuid = UUID.fromString(id);
        return sportService.getSportById(String.valueOf(uuid))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Sport> createSport(@RequestBody Sport sport) {
        Sport savedSport = sportService.createSport(sport);
        return new ResponseEntity<>(savedSport, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Sport> updateSport(@PathVariable String id, @RequestBody Sport sport) {
        return ResponseEntity.ok(sportService.updateSport(id, sport));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSport(@PathVariable String id) {
        sportService.deleteSport(id);
        return ResponseEntity.noContent().build();
    }
} 