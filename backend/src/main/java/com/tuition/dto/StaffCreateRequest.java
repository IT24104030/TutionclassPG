package com.tuition.dto;

import com.tuition.model.Staff;
import java.math.BigDecimal;
import java.time.LocalDate;

public record StaffCreateRequest(
    String fullName,
    Staff.StaffRole role,
    String phone,
    String email,
    BigDecimal basicSalary,
    BigDecimal commissionRate,
    LocalDate joinedDate,
    String address
) {
    public Staff.StaffRole getRoleEnum() {
        return role;
    }
}
