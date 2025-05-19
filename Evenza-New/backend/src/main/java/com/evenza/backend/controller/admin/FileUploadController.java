package com.evenza.backend.controller.admin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.evenza.backend.services.FileStorageService;

@RestController
@RequestMapping("/api/admin/uploads")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"})
public class FileUploadController {

    @Autowired
    private FileStorageService fileStorageService;
    
    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @PostMapping("/images")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String filename = fileStorageService.storeFile(file);
        
        // Create file URL
        String fileUrl = ServletUriComponentsBuilder.fromHttpUrl(baseUrl)
                .path("/api/uploads/")
                .path(filename)
                .toUriString();
        
        Map<String, String> response = new HashMap<>();
        response.put("filename", filename);
        response.put("url", fileUrl);
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/images/{filename}")
    public ResponseEntity<Map<String, String>> deleteImage(@PathVariable String filename) {
        fileStorageService.deleteFile(filename);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "File deleted successfully");
        response.put("filename", filename);
        
        return ResponseEntity.ok(response);
    }
} 