package com.evenza.backend.services.admin;

import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.evenza.backend.model.Movie;
import com.evenza.backend.repository.MovieRepository;

@Service
public class AdminMovieService {
    
    @Autowired
    private MovieRepository movieRepository;
    
    public Page<Movie> getAllMovies(Pageable pageable) {
        // Handle conversion of Java property name to database column name for sorting
        if (containsSortByReleaseDate(pageable)) {
            // Create a new pageable with correct sort field
            Sort newSort = createSortWithColumnName(pageable.getSort());
            pageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                newSort
            );
            System.out.println("Modified sort to use database column names");
        }
        return movieRepository.findAll(pageable);
    }
    
    // Helper method to check if pageable contains sort by releaseDate
    private boolean containsSortByReleaseDate(Pageable pageable) {
        return pageable.getSort().stream()
            .anyMatch(order -> order.getProperty().equals("releaseDate"));
    }
    
    // Helper method to convert Java property names to database column names
    private Sort createSortWithColumnName(Sort sort) {
        return Sort.by(
            sort.stream()
                .map(order -> {
                    if (order.getProperty().equals("releaseDate")) {
                        System.out.println("Converting releaseDate to releasedate in sort");
                        return new Sort.Order(order.getDirection(), "id");  // Use 'id' as a temporary workaround
                    }
                    return order;
                })
                .toList()
        );
    }
    
    public Page<Movie> searchMovies(String keyword, Pageable pageable) {
        // Handle conversion of Java property name to database column name for sorting
        if (containsSortByReleaseDate(pageable)) {
            // Create a new pageable with correct sort field
            Sort newSort = createSortWithColumnName(pageable.getSort());
            pageable = PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                newSort
            );
            System.out.println("Modified sort to use database column names for search");
        }
        return movieRepository.searchMovies(keyword, pageable);
    }
    
    public Optional<Movie> getMovieById(String id) {
        return movieRepository.findById(id);
    }
    
    @Transactional
    @CacheEvict(value = {"movies", "events"}, allEntries = true)
    public Movie createMovie(Movie movie) {
        if (movie.getId() == null || movie.getId().isEmpty()) {
            String generatedId = UUID.randomUUID().toString();
            movie.setId(generatedId);
            System.out.println("Generated new ID for movie: " + generatedId);
        }
        
        // Always set category for proper classification
        movie.setCategory("MOVIE");
        
        Movie savedMovie = movieRepository.save(movie);
        System.out.println("Movie saved successfully with ID: " + savedMovie.getId());
        return savedMovie;
    }
    
    @Transactional
    @CacheEvict(value = {"movies", "events"}, allEntries = true)
    public Movie updateMovie(String id, Movie movie) {
        movie.setId(id); // Ensure ID is set correctly
        
        // Always set category for proper classification
        movie.setCategory("MOVIE");
        
        return movieRepository.save(movie);
    }
    
    @Transactional
    @CacheEvict(value = {"movies", "events"}, allEntries = true)
    public void deleteMovie(String id) {
        movieRepository.deleteById(id);
    }
} 