package com.tuition.controller;

import com.tuition.model.Resource;
import com.tuition.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/resources")
public class ResourceController {

    @Autowired private ResourceRepository resourceRepo;

    @Value("${file.upload.dir}")
    private String uploadDir;

    @GetMapping
    public List<Resource> getAll() { return resourceRepo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getById(@PathVariable Long id) {
        return resourceRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batch/{batchId}")
    public List<Resource> getByBatch(@PathVariable Long batchId) {
        return resourceRepo.findByBatchesId(batchId);
    }

    @GetMapping("/type/{type}")
    public List<Resource> getByType(@PathVariable Resource.ResourceType type) {
        return resourceRepo.findByResourceType(type);
    }

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file")     MultipartFile file,
            @RequestParam("title")    String title,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "fileType", required = false) String fileType,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "restricted",  required = false) Boolean restricted,
            @RequestParam(value = "isRestricted", required = false) Boolean isRestricted) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "File is required"));
        }

        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        }

        String normalizedType = (type != null && !type.trim().isEmpty()) ? type : fileType;
        if (normalizedType == null || normalizedType.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Type is required"));
        }

        boolean finalRestricted = Boolean.TRUE.equals(restricted) || Boolean.TRUE.equals(isRestricted);

        try {
            // Create upload directory
            Path dirPath = Paths.get(uploadDir);
            if (!Files.exists(dirPath)) Files.createDirectories(dirPath);

            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
            }

            // Only save when selected resource type matches uploaded file extension.
            String normalizedTypeUpper = normalizedType.trim().toUpperCase();
            switch (normalizedTypeUpper) {
                case "PDF" -> {
                    if (ext.isEmpty() || !ext.equals(".pdf")) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "message",
                                "Selected type is PDF, but uploaded file has extension '" + ext + "'(expected .pdf)"
                        ));
                    }
                }
                case "PPT" -> {
                    boolean validPpt = ext.equals(".ppt") || ext.equals(".pptx");
                    if (ext.isEmpty() || !validPpt) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "message",
                                "Selected type is PPT, but uploaded file has extension '" + ext + "' (expected .ppt or .pptx)"
                        ));
                    }
                }
                case "DOC" -> {
                    boolean validDoc = ext.equals(".doc") || ext.equals(".docx");
                    if (ext.isEmpty() ||!validDoc ) {
                        return ResponseEntity.badRequest().body(Map.of(
                                "message",
                                "Selected type is DOC, but uploaded file has extension '" + ext + "' (expected .doc or .docx)"
                        ));
                    }
                }
                default -> {
                    // For VIDEO, MODEL_PAPER, OTHER we don't enforce extension matching.
                }
            }

            String savedName    = UUID.randomUUID() + "_" + originalName;
            Path   filePath     = dirPath.resolve(savedName);
            Files.copy(file.getInputStream(), filePath);

            Resource resource = new Resource();
            resource.setTitle(title);
            resource.setDescription(description);
            resource.setResourceType(Resource.ResourceType.valueOf(normalizedTypeUpper));
            resource.setFileName(originalName);
            resource.setFilePath(filePath.toString());
            resource.setFileSize(file.getSize());
            resource.setIsRestricted(finalRestricted);
            resource.setCreatedAt(LocalDateTime.now());
            resource.setUpdatedAt(LocalDateTime.now());

            return ResponseEntity.ok(resourceRepo.save(resource));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid resource type"));
        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<?> download(@PathVariable Long id) {
        return resourceRepo.findById(id).map(r -> {
            File file = new File(r.getFilePath());
            if (!file.exists()) return ResponseEntity.notFound().<FileSystemResource>build();
            FileSystemResource fsr = new FileSystemResource(file);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + r.getFileName() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fsr);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> update(@PathVariable Long id, @RequestBody Resource updated) {
        return resourceRepo.findById(id).map(r -> {
            r.setTitle(updated.getTitle());
            r.setDescription(updated.getDescription());
            r.setIsRestricted(updated.getIsRestricted());
            r.setVersion(updated.getVersion());
            r.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(resourceRepo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        resourceRepo.findById(id).ifPresent(r -> {
            try { new File(r.getFilePath()).delete(); }
            catch (Exception ignored) {}
            resourceRepo.delete(r);
        });
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }
}
