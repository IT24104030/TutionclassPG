package com.tuition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type", nullable = false)
    private ResourceType resourceType;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 20)
    private String version = "1.0";

    @Column(name = "is_restricted")
    private Boolean isRestricted = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    private User uploadedBy;

    @ManyToMany
    @JoinTable(
        name = "resource_batches",
        joinColumns = @JoinColumn(name = "resource_id"),
        inverseJoinColumns = @JoinColumn(name = "batch_id")
    )
    private List<Batch> batches;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum ResourceType {
        PDF, PPT, DOC, VIDEO, MODEL_PAPER, OTHER
    }
}
