package com.tuition.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Campaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_name", nullable = false, length = 150)
    @NotBlank(message = "Campaign name is required")
    private String campaignName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @NotNull(message = "Platform is required")
    private Platform platform;

    @Column(name = "start_date", nullable = false)
    @NotNull(message = "Start date is required")
    @FutureOrPresent(message = "Start date must be today or in the future")
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    @NotNull(message = "End date is required")
    private LocalDate endDate;

    @Column(precision = 10, scale = 2)
    private BigDecimal budget = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @AssertTrue(message = "End date must be after start date")
    private boolean isEndDateAfterStartDate() {
        return endDate == null || startDate == null || endDate.isAfter(startDate);
    }

    public enum Platform {
        FACEBOOK, INSTAGRAM, YOUTUBE, TIKTOK, WHATSAPP, REFERRAL, POSTER, OTHER
    }
    public enum Status {
        ACTIVE, COMPLETED, PAUSED
    }
}
