package com.tuition.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", unique = true, nullable = false, length = 20)
    private String studentId;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Gender gender;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 150)
    private String school;

    @Column(name = "al_year")
    private Integer alYear;

    @Column(name = "parent_name", length = 100)
    private String parentName;

    @Column(name = "parent_phone", length = 15)
    private String parentPhone;

    @Column(name = "profile_photo")
    private String profilePhoto;

    @Column(name = "intake_source", length = 100)
    private String intakeSource;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum Gender {
        MALE, FEMALE
    }
}
