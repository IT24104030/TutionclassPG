package com.tuition.dto;

import java.math.BigDecimal;

public record PayrollCreateRequest(
    Long staffId,
    Integer month,
    Integer year,
    BigDecimal commission,
    BigDecimal bonuses,
    BigDecimal deductions,
    String notes
) {}
