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

import com.evenza.backend.model.Movie;
import com.evenza.backend.services.admin.AdminMovieService;

@RestController
@RequestMapping("/api/admin/movies")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class AdminMovieController {
    
    @Autowired
    private AdminMovieService movieService;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllMovies(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "releaseDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String keyword) {
        
        System.out.println("AdminMovieController - Getting movies with sort: " + sortBy + ", direction: " + sortDir);
        
        Sort.Direction direction = sortDir.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        
        try {
            // Don't convert the property name - use the Java field name as is
            // JPA/Hibernate will map it to the correct database column
            PageRequest pageRequest = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<Movie> moviePage;
            
            if (keyword != null && !keyword.isEmpty()) {
                System.out.println("Searching movies with keyword: " + keyword);
                moviePage = movieService.searchMovies(keyword, pageRequest);
            } else {
                System.out.println("Getting all movies");
                moviePage = movieService.getAllMovies(pageRequest);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("movies", moviePage.getContent());
            response.put("currentPage", moviePage.getNumber());
            response.put("totalItems", moviePage.getTotalElements());
            response.put("totalPages", moviePage.getTotalPages());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error in AdminMovieController.getAllMovies: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch movies");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<?> getMovieById(@PathVariable String id) {
        return movieService.getMovieById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Movie> createMovie(@RequestBody Movie movie) {
        Movie savedMovie = movieService.createMovie(movie);
        return new ResponseEntity<>(savedMovie, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Movie> updateMovie(@PathVariable String id, @RequestBody Movie movie) {
        return ResponseEntity.ok(movieService.updateMovie(id, movie));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable String id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
} 