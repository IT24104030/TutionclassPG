package com.tuition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "staff_id", unique = true, nullable = false, length = 20)
    private String staffId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffRole role;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20, unique = true)
    private String nic;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "joined_date", nullable = false)
    private LocalDate joinedDate;

    @Column(name = "basic_salary", precision = 10, scale = 2)
    private BigDecimal basicSalary = BigDecimal.ZERO;

    @Column(name = "commission_rate", precision = 5, scale = 2)
    private BigDecimal commissionRate = BigDecimal.ZERO;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum StaffRole {
        ADMIN, ASSISTANT, COORDINATOR
    }
}
