package com.tuition.controller;

import com.tuition.model.*;
import com.tuition.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/staff")
public class StaffController {

    @Autowired private StaffRepository           staffRepo;
    @Autowired private StaffAttendanceRepository  staffAttRepo;
    @Autowired private PayrollRepository          payrollRepo;
    @Autowired private StaffTaskRepository        taskRepo;

    // ---- STAFF CRUD ----
    @GetMapping
    public List<Staff> getAll() { return staffRepo.findByIsActiveTrue(); }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable Long id) {
        return staffRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Staff staff) {
        String validationMessage = validateStaff(staff);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        if (staff.getJoinedDate() == null) {
            staff.setJoinedDate(LocalDate.now());
        }

        String sid = "STF" + String.format("%04d", staffRepo.count() + 1);
        staff.setStaffId(sid);
        return ResponseEntity.ok(staffRepo.save(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Staff updated) {
        String validationMessage = validateStaff(updated);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        return staffRepo.findById(id).map(s -> {
            s.setFullName(updated.getFullName());
            s.setPhone(updated.getPhone());
            s.setEmail(updated.getEmail());
            s.setAddress(updated.getAddress());
            s.setRole(updated.getRole());
            s.setDateOfBirth(updated.getDateOfBirth());
            s.setJoinedDate(updated.getJoinedDate());
            s.setBasicSalary(updated.getBasicSalary());
            s.setCommissionRate(updated.getCommissionRate());
            return ResponseEntity.ok(staffRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return staffRepo.findById(id).map(s -> {
            s.setIsActive(false);
            staffRepo.save(s);
            return ResponseEntity.ok(Map.of("message","Deactivated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- STAFF ATTENDANCE ----
    @GetMapping("/{id}/attendance")
    public List<StaffAttendance> getAttendance(@PathVariable Long id) {
        return staffAttRepo.findByStaffId(id);
    }

    @GetMapping("/attendance/date/{date}")
    public List<StaffAttendance> getAttendanceByDate(@PathVariable String date) {
        return staffAttRepo.findByDate(LocalDate.parse(date));
    }

    @PostMapping("/attendance")
    public ResponseEntity<StaffAttendance> markAttendance(@RequestBody StaffAttendance att) {
        return ResponseEntity.ok(staffAttRepo.save(att));
    }

    @PostMapping("/attendance/bulk")
    public ResponseEntity<?> markAttendanceBulk(@RequestBody List<StaffAttendance> records) {
        if (records == null || records.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No attendance records to save", "saved", 0));
        }
        return ResponseEntity.ok(staffAttRepo.saveAll(records));
    }

    // ---- PAYROLL ----
    @GetMapping("/{id}/payroll")
    public List<Payroll> getPayroll(@PathVariable Long id) {
        return payrollRepo.findByStaffId(id);
    }

    @GetMapping("/payroll/month/{month}/year/{year}")
    public List<Payroll> getPayrollByMonthYear(@PathVariable Integer month, @PathVariable Integer year) {
        String mm = String.format("%02d", month);
        String monthName = Month.of(month).name();
        return payrollRepo.findAll().stream()
                .filter(p -> p.getPayYear() != null && p.getPayYear().equals(year))
                .filter(p -> {
                    String payMonth = p.getPayMonth();
                    if (payMonth == null) return false;
                    String normalized = payMonth.trim();
                    return normalized.equalsIgnoreCase(mm)
                            || normalized.equalsIgnoreCase(monthName)
                            || normalized.startsWith(mm + "-")
                            || normalized.equalsIgnoreCase(monthName.substring(0, 3));
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/payroll")
    public ResponseEntity<Payroll> createPayroll(@RequestBody Payroll payroll) {
        if (payroll.getPayMonth() == null || payroll.getPayMonth().isBlank()) {
            payroll.setPayMonth(String.format("%02d", LocalDate.now().getMonthValue()));
        }
        if (payroll.getPayYear() == null) {
            payroll.setPayYear(LocalDate.now().getYear());
        }
        if (payroll.getBasicSalary() == null) {
            BigDecimal fallback = payroll.getStaff() != null && payroll.getStaff().getBasicSalary() != null
                    ? payroll.getStaff().getBasicSalary()
                    : BigDecimal.ZERO;
            payroll.setBasicSalary(fallback);
        }

        // Calculate net salary
        BigDecimal net = payroll.getBasicSalary()
                .add(payroll.getCommission() != null ? payroll.getCommission() : BigDecimal.ZERO)
                .add(payroll.getBonuses()    != null ? payroll.getBonuses()    : BigDecimal.ZERO)
                .subtract(payroll.getDeductions() != null ? payroll.getDeductions() : BigDecimal.ZERO);
        payroll.setNetSalary(net);
        return ResponseEntity.ok(payrollRepo.save(payroll));
    }

    @PutMapping("/payroll/{id}/pay")
    public ResponseEntity<Payroll> payPayroll(@PathVariable Long id) {
        return payrollRepo.findById(id).map(p -> {
            p.setStatus(Payroll.Status.PAID);
            p.setPaidDate(java.time.LocalDate.now());
            return ResponseEntity.ok(payrollRepo.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/payroll/{id}/mark-paid")
    public ResponseEntity<Payroll> markPayrollPaid(@PathVariable Long id) {
        return payPayroll(id);
    }

    // ---- STAFF TASKS ----
    @GetMapping("/{id}/tasks")
    public List<StaffTask> getTasks(@PathVariable Long id) {
        return taskRepo.findByAssignedToId(id);
    }

    @GetMapping("/tasks")
    public List<Map<String, Object>> getAllTasks() {
        return taskRepo.findAll().stream().map(this::taskView).collect(Collectors.toList());
    }

    @GetMapping("/tasks/{id}")
    public ResponseEntity<?> getTaskById(@PathVariable Long id) {
        return taskRepo.findById(id)
                .map(t -> ResponseEntity.ok(taskView(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tasks")
    public ResponseEntity<?> createTask(@RequestBody StaffTask task) {
        if (task.getAssignedTo() == null || task.getAssignedTo().getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Assigned staff is required"));
        }
        return ResponseEntity.ok(taskView(taskRepo.save(task)));
    }

    @PutMapping("/tasks/{id}")
    public ResponseEntity<?> updateTask(@PathVariable Long id, @RequestBody StaffTask updated) {
        return taskRepo.findById(id).map(t -> {
            t.setTitle(updated.getTitle());
            t.setDescription(updated.getDescription());
            t.setPriority(updated.getPriority());
            t.setDueDate(updated.getDueDate());
            t.setStatus(updated.getStatus());
            if (updated.getAssignedTo() != null) {
                t.setAssignedTo(updated.getAssignedTo());
            }
            if (updated.getStatus() == StaffTask.Status.COMPLETED)
                t.setCompletedAt(LocalDateTime.now());
            return ResponseEntity.ok(taskView(taskRepo.save(t)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/tasks/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id) {
        taskRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }

    // ---- STATS ----
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return Map.of(
            "totalStaff",   staffRepo.countByIsActiveTrue(),
            "pendingTasks", taskRepo.findByStatus(StaffTask.Status.PENDING).size()
        );
    }

    private String validateStaff(Staff staff) {
        if (staff == null) return "Invalid request body";

        LocalDate dob = staff.getDateOfBirth();
        if (dob != null && dob.isAfter(LocalDate.now())) {
            return "Date of birth cannot be in the future";
        }

        LocalDate joinedDate = staff.getJoinedDate();
        if (joinedDate != null && joinedDate.isAfter(LocalDate.now())) {
            return "Joined date cannot be in the future";
        }

        return null;
    }

    private Map<String, Object> taskView(StaffTask task) {
        Map<String, Object> assignedTo = null;
        if (task.getAssignedTo() != null) {
            assignedTo = new HashMap<>();
            assignedTo.put("id", task.getAssignedTo().getId());
            assignedTo.put("fullName", task.getAssignedTo().getFullName());
            assignedTo.put("staffId", task.getAssignedTo().getStaffId());
        }

                Map<String, Object> view = new HashMap<>();
                view.put("id", task.getId());
                view.put("title", task.getTitle() == null ? "" : task.getTitle());
                view.put("description", task.getDescription());
                view.put("priority", task.getPriority());
                view.put("dueDate", task.getDueDate());
                view.put("status", task.getStatus());
                view.put("assignedTo", assignedTo);
                view.put("completedAt", task.getCompletedAt());
                view.put("createdAt", task.getCreatedAt());
                return view;
    }
}
