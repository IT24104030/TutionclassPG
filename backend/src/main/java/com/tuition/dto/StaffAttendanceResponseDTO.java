package com.tuition.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record StaffAttendanceResponseDTO(
    Long id,
    Long staffId,
    String staffName,
    String staffCode,
    LocalDate date,
    LocalTime checkIn,
    LocalTime checkOut,
    String status,
    String notes,
    LocalDateTime createdAt
) {}
