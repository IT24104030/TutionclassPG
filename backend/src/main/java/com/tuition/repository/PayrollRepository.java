package com.tuition.repository;

import com.tuition.model.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    List<Payroll> findByStaffId(Long staffId);
    List<Payroll> findByPayMonthAndPayYear(String month, Integer year);
    List<Payroll> findByStatus(Payroll.Status status);

    Optional<Payroll> findByStaffIdAndPayMonthAndPayYear(Long staffId, String payMonth, int payYear);

    void deleteByStaffId(Long staffId);

    @Query("SELECT SUM(p.netSalary) FROM Payroll p WHERE p.payMonth = ?1 AND p.payYear = ?2")
    BigDecimal totalPayrollForMonth(String month, Integer year);
}
