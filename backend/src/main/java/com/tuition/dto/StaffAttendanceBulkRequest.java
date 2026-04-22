package com.tuition.dto;

import com.tuition.model.StaffAttendance;
import java.time.LocalDate;

public record StaffAttendanceBulkRequest(
    Long staffId,
    LocalDate date,
    StaffAttendance.Status status
) {
    public StaffAttendance.Status getStatusEnum() {
        return status;
    }
}
