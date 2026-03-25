package com.tuition.repository;

import com.tuition.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByStudentId(Long studentId);
    List<Payment> findByBatchId(Long batchId);
    List<Payment> findByStatus(Payment.Status status);
    List<Payment> findByPaymentMonthAndPaymentYear(String month, Integer year);
    List<Payment> findByStudentIdAndPaymentYear(Long studentId, Integer year);

    @Query("SELECT SUM(p.amountPaid) FROM Payment p WHERE p.status = 'PAID'")
    BigDecimal totalIncome();

    @Query("SELECT SUM(p.amountPaid) FROM Payment p WHERE p.paymentMonth = ?1 AND p.paymentYear = ?2")
    BigDecimal monthlyIncome(String month, Integer year);

    @Query("SELECT SUM(p.amountPaid) FROM Payment p WHERE p.batch.id = ?1")
    BigDecimal batchIncome(Long batchId);

    long countByStatus(Payment.Status status);
}
