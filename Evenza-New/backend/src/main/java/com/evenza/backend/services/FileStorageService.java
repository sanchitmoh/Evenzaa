package com.evenza.backend.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDirectory;
    
    private Path getUploadPath() {
        Path uploadPath = Paths.get(uploadDirectory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
        return uploadPath;
    }
    
    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty file");
        }
        
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = extractExtension(originalFilename);
        
        // Generate unique filename
        String newFilename = UUID.randomUUID().toString() + fileExtension;
        
        try {
            Path targetLocation = getUploadPath().resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            
            return newFilename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }
    
    private String extractExtension(String filename) {
        return filename.contains(".") ? 
               filename.substring(filename.lastIndexOf(".")) : "";
    }
    
    public void deleteFile(String filename) {
        try {
            Path filePath = getUploadPath().resolve(filename);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file " + filename, e);
        }
    }
} 