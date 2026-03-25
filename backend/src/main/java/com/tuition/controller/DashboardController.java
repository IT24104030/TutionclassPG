package com.tuition.controller;

import com.tuition.model.Payment;
import com.tuition.model.Schedule;
import com.tuition.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired private StudentRepository  studentRepo;
    @Autowired private StaffRepository    staffRepo;
    @Autowired private BatchRepository    batchRepo;
    @Autowired private PaymentRepository  paymentRepo;
    @Autowired private ScheduleRepository scheduleRepo;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalStudents",   studentRepo.countByIsActiveTrue());
        stats.put("totalStaff",      staffRepo.countByIsActiveTrue());
        stats.put("totalBatches",    batchRepo.findByIsActiveTrue().size());
        stats.put("todayClasses",    scheduleRepo.findByClassDate(LocalDate.now()).size());

        BigDecimal totalIncome = paymentRepo.totalIncome();
        stats.put("totalIncome",     totalIncome != null ? totalIncome : BigDecimal.ZERO);

        stats.put("pendingPayments", paymentRepo.countByStatus(Payment.Status.PENDING));
        stats.put("overduePayments", paymentRepo.countByStatus(Payment.Status.OVERDUE));

        var upcomingClasses = scheduleRepo.findByClassDateBetween(
                LocalDate.now(), LocalDate.now().plusDays(7));
        stats.put("upcomingClasses", upcomingClasses.size());

        return stats;
    }
}
