package com.tuition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "batch_name", nullable = false, length = 100)
    private String batchName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(nullable = false)
    private Integer year;

    @Enumerated(EnumType.STRING)
    private Medium medium = Medium.SINHALA;

    @Column(name = "max_students")
    private Integer maxStudents = 50;

    @Column(name = "fee_amount", precision = 10, scale = 2)
    private BigDecimal feeAmount = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Medium {
        SINHALA, TAMIL, ENGLISH
    }
}
