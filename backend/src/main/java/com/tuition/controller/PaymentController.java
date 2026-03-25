package com.tuition.controller;

import com.tuition.model.Payment;
import com.tuition.repository.BatchRepository;
import com.tuition.repository.PaymentRepository;
import com.tuition.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    @Autowired private PaymentRepository  paymentRepo;
    @Autowired private StudentRepository  studentRepo;
    @Autowired private BatchRepository    batchRepo;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return paymentRepo.findAll().stream().map(this::toPaymentDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return paymentRepo.findById(id).map(p -> ResponseEntity.ok(toPaymentDto(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public List<Payment> getByStudent(@PathVariable Long studentId) {
        return paymentRepo.findByStudentId(studentId);
    }

    @GetMapping("/batch/{batchId}")
    public List<Payment> getByBatch(@PathVariable Long batchId) {
        return paymentRepo.findByBatchId(batchId);
    }

    @GetMapping("/status/{status}")
    public List<Payment> getByStatus(@PathVariable Payment.Status status) {
        return paymentRepo.findByStatus(status);
    }

    @GetMapping("/month/{month}/year/{year}")
    public List<Payment> getByMonthYear(@PathVariable String month, @PathVariable Integer year) {
        return paymentRepo.findByPaymentMonthAndPaymentYear(month, year);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body) {
        Long studentId = nestedId(body.get("student"));
        Long batchId = nestedId(body.get("batch"));

        if (studentId == null || batchId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student and batch are required"));
        }

        var studentOpt = studentRepo.findById(studentId);
        var batchOpt = batchRepo.findById(batchId);
        if (studentOpt.isEmpty() || batchOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid student or batch"));
        }

        Payment payment = new Payment();
        payment.setStudent(studentOpt.get());
        payment.setBatch(batchOpt.get());
        payment.setPaymentMonth(String.valueOf(body.getOrDefault("paymentMonth", "")));
        payment.setPaymentYear(intValue(body.get("paymentYear"), LocalDate.now().getYear()));

        BigDecimal amount = decimalValue(body.get("amount"));
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(Map.of("message", "Amount must be greater than 0"));
        }

        Payment.Status status = parseStatus(String.valueOf(body.getOrDefault("status", "PENDING")));
        LocalDate paidDate = parseDate(body.get("paidDate"));
        if (paidDate != null && paidDate.isAfter(LocalDate.now())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Paid date cannot be in the future"));
        }
        payment.setStatus(status);
        payment.setAmountDue(amount);
        payment.setAmountPaid(status == Payment.Status.PAID ? amount : BigDecimal.ZERO);
        payment.setPaidDate(paidDate);
        payment.setNotes(String.valueOf(body.getOrDefault("notes", "")));
        payment.setPaymentMethod(Payment.PaymentMethod.CASH);
        payment.setReceiptNo(status == Payment.Status.PAID ? ("RCP" + System.currentTimeMillis()) : null);

        Payment saved = paymentRepo.save(payment);
        return ResponseEntity.ok(toPaymentDto(saved));
    }

    @PutMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> markPaid(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        return paymentRepo.findById(id).map(p -> {
            BigDecimal amountPaid = null;
            if (body != null && body.get("amountPaid") != null) {
                amountPaid = decimalValue(body.get("amountPaid"));
            }
            if (amountPaid == null || amountPaid.compareTo(BigDecimal.ZERO) <= 0) {
                amountPaid = p.getAmountDue() != null ? p.getAmountDue() : BigDecimal.ZERO;
            }
            p.setAmountPaid(amountPaid);
            p.setPaidDate(LocalDate.now());
            String method = body != null ? String.valueOf(body.getOrDefault("method", "CASH")) : "CASH";
            p.setPaymentMethod(Payment.PaymentMethod.valueOf(method));
            p.setStatus(Payment.Status.PAID);
            p.setReceiptNo("RCP" + System.currentTimeMillis());
            return ResponseEntity.ok(toPaymentDto(paymentRepo.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<Map<String, Object>> markPaidCompat(@PathVariable Long id) {
        return paymentRepo.findById(id).map(p -> {
            BigDecimal amountPaid = p.getAmountDue() != null ? p.getAmountDue() : BigDecimal.ZERO;
            p.setAmountPaid(amountPaid);
            p.setPaidDate(LocalDate.now());
            p.setPaymentMethod(Payment.PaymentMethod.CASH);
            p.setStatus(Payment.Status.PAID);
            if (p.getReceiptNo() == null || p.getReceiptNo().isBlank()) {
                p.setReceiptNo("RCP" + System.currentTimeMillis());
            }
            return ResponseEntity.ok(toPaymentDto(paymentRepo.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return paymentRepo.findById(id).map(p -> {
            BigDecimal amount = decimalValue(body.get("amount"));
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                p.setAmountDue(amount);
                if (p.getStatus() == Payment.Status.PAID) p.setAmountPaid(amount);
            }

            if (body.get("status") != null) {
                Payment.Status status = parseStatus(String.valueOf(body.get("status")));
                p.setStatus(status);
                if (status == Payment.Status.PAID && (p.getAmountPaid() == null || p.getAmountPaid().compareTo(BigDecimal.ZERO) <= 0)) {
                    p.setAmountPaid(p.getAmountDue());
                }
            }

            if (body.get("paidDate") != null) {
                LocalDate paidDate = parseDate(body.get("paidDate"));
                if (paidDate != null && paidDate.isAfter(LocalDate.now())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Paid date cannot be in the future"));
                }
                p.setPaidDate(paidDate);
            }
            p.setNotes(String.valueOf(body.getOrDefault("notes", "")));

            Payment saved = paymentRepo.save(p);
            return ResponseEntity.ok(toPaymentDto(saved));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        paymentRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }

    // ---- INCOME REPORTS ----
    @GetMapping("/reports/total")
    public Map<String, Object> totalIncome() {
        BigDecimal total = paymentRepo.totalIncome();
        return Map.of(
            "totalIncome",   total != null ? total : BigDecimal.ZERO,
            "pendingCount",  paymentRepo.countByStatus(Payment.Status.PENDING),
            "paidCount",     paymentRepo.countByStatus(Payment.Status.PAID)
        );
    }

    @GetMapping("/reports/monthly/{month}/{year}")
    public Map<String, Object> monthlyIncome(@PathVariable String month, @PathVariable Integer year) {
        BigDecimal income = paymentRepo.monthlyIncome(month, year);
        return Map.of("month", month, "year", year,
                      "income", income != null ? income : BigDecimal.ZERO);
    }

    @GetMapping("/reports/batch/{batchId}")
    public Map<String, Object> batchIncome(@PathVariable Long batchId) {
        BigDecimal income = paymentRepo.batchIncome(batchId);
        return Map.of("batchId", batchId,
                      "income", income != null ? income : BigDecimal.ZERO);
    }

    private Map<String, Object> toPaymentDto(Payment p) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", p.getId());
        dto.put("paymentMonth", p.getPaymentMonth());
        dto.put("paymentYear", p.getPaymentYear());
        dto.put("amount", p.getAmountDue());
        dto.put("amountDue", p.getAmountDue());
        dto.put("amountPaid", p.getAmountPaid());
        dto.put("paidDate", p.getPaidDate());
        dto.put("status", p.getStatus());
        dto.put("receiptNo", p.getReceiptNo());
        dto.put("notes", p.getNotes());

        if (p.getStudent() != null) {
            dto.put("student", Map.of(
                    "id", p.getStudent().getId(),
                    "fullName", p.getStudent().getFullName()
            ));
        } else {
            dto.put("student", null);
        }

        if (p.getBatch() != null) {
            dto.put("batch", Map.of(
                    "id", p.getBatch().getId(),
                    "batchName", p.getBatch().getBatchName()
            ));
        } else {
            dto.put("batch", null);
        }
        return dto;
    }

    @SuppressWarnings("unchecked")
    private Long nestedId(Object nested) {
        if (!(nested instanceof Map<?, ?> m)) return null;
        Object id = m.get("id");
        if (id == null) return null;
        try { return Long.parseLong(String.valueOf(id)); }
        catch (Exception ex) { return null; }
    }

    private Integer intValue(Object value, Integer defaultValue) {
        if (value == null) return defaultValue;
        try { return Integer.parseInt(String.valueOf(value)); }
        catch (Exception ex) { return defaultValue; }
    }

    private BigDecimal decimalValue(Object value) {
        if (value == null || String.valueOf(value).isBlank()) return null;
        try { return new BigDecimal(String.valueOf(value)); }
        catch (Exception ex) { return null; }
    }

    private LocalDate parseDate(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        if (text.isEmpty() || "null".equalsIgnoreCase(text)) return null;
        return LocalDate.parse(text);
    }

    private Payment.Status parseStatus(String value) {
        try { return Payment.Status.valueOf(value.toUpperCase()); }
        catch (Exception ex) { return Payment.Status.PENDING; }
    }
}
