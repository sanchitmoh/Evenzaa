package com.evenza.backend.controller;

import com.evenza.backend.DTO.SearchResult;
import com.evenza.backend.services.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<List<SearchResult>> search(@RequestParam String query) {
        List<SearchResult> results = searchService.searchAcrossAllCategories(query);
        return ResponseEntity.ok(results);
    }
}