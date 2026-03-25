package com.tuition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Column(name = "exam_name", nullable = false, length = 100)
    private String examName;

    @Enumerated(EnumType.STRING)
    @Column(name = "exam_type", nullable = false)
    private ExamType examType;

    @Column(name = "marks_obtained", precision = 6, scale = 2)
    private BigDecimal marksObtained;

    @Column(name = "total_marks", precision = 6, scale = 2)
    private BigDecimal totalMarks;

    @Column(length = 5)
    private String grade;

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ExamType {
        MONTHLY_TEST, TERM_TEST, MOCK_EXAM, FINAL
    }
}
