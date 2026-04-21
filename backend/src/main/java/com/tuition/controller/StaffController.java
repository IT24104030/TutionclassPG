package com.tuition.controller;

import com.tuition.dto.PayrollCreateRequest;
import com.tuition.dto.StaffCreateRequest;
import com.tuition.dto.StaffAttendanceBulkRequest;
import com.tuition.dto.StaffAttendanceResponseDTO;
import com.tuition.model.*;
import com.tuition.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Month;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/staff")
public class StaffController {

    private static final Logger log = LoggerFactory.getLogger(StaffController.class);

    private static final Pattern DIGITS_ONLY = Pattern.compile("\\D");
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // Allow only letters (any language) and spaces; reject symbols/numbers.
    private static final Pattern FULLNAME_ALLOWED = Pattern.compile("^[\\p{L} ]+$");

    private static final BigDecimal COMMISSION_MAX = new BigDecimal("100");

    @Autowired private StaffRepository           staffRepo;
    @Autowired private StaffAttendanceRepository  staffAttRepo;
    @Autowired private PayrollRepository          payrollRepo;
    @Autowired private StaffTaskRepository        taskRepo;

    // ---- STAFF CRUD ----
    @GetMapping
    public List<Staff> getAll() { return staffRepo.findByIsActiveTrue(); }

    @GetMapping("/all")
    public List<Staff> getAllIncludingInactive() { return staffRepo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Staff> getById(@PathVariable Long id) {
        return staffRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody StaffCreateRequest req) {
        Staff staff = new Staff();
        staff.setFullName(req.fullName());
        staff.setRole(req.getRoleEnum());
        staff.setPhone(req.phone());
        staff.setEmail(req.email());
        staff.setBasicSalary(req.basicSalary() != null ? req.basicSalary() : BigDecimal.ZERO);
        staff.setCommissionRate(req.commissionRate() != null ? req.commissionRate() : BigDecimal.ZERO);
        staff.setJoinedDate(req.joinedDate());
        staff.setAddress(req.address());
        staff.setNic(null);
        staff.setStaffId(null);
        staff.setId(null);

        String validationMessage = validateStaff(staff);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        if (staff.getJoinedDate() == null) {
            staff.setJoinedDate(LocalDate.now());
        }

        Long maxSuffix = staffRepo.maxStfNumericSuffix();
        long nextNum = (maxSuffix == null ? 0L : maxSuffix) + 1;
        for (int attempt = 0; attempt < 12; attempt++) {
            String candidate = "STF" + String.format("%04d", nextNum);
            while (staffRepo.findByStaffId(candidate).isPresent()) {
                nextNum++;
                candidate = "STF" + String.format("%04d", nextNum);
            }
            staff.setStaffId(candidate);
            try {
                return ResponseEntity.ok(staffRepo.save(staff));
            } catch (DataIntegrityViolationException e) {
                Throwable root = e.getMostSpecificCause();
                log.warn("Staff create failed (attempt {}): {}", attempt + 1, root != null ? root.getMessage() : e.getMessage());
                staff.setId(null);
                nextNum++;
            }
        }
        return ResponseEntity.status(409).body(Map.of(
                "message",
                "Could not save staff (database rejected the row). Restart the API so Flyway can run migration V3, then try again. Details are in the server log."));
    }

    @PutMapping("/{id}/activate")
    @Transactional
    public ResponseEntity<?> activateStaff(@PathVariable Long id) {
        return staffRepo.findById(id).map(staff -> {
            staff.setIsActive(true);
            return ResponseEntity.ok(staffRepo.save(staff));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/deactivate")
    @Transactional
    public ResponseEntity<?> deactivateStaff(@PathVariable Long id) {
        return staffRepo.findById(id).map(staff -> {
            staff.setIsActive(false);
            return ResponseEntity.ok(staffRepo.save(staff));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Staff updated) {
        String validationMessage = validateStaff(updated);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        return staffRepo.findById(id).map(s -> {
            // Store old basic salary to check if it changed
            BigDecimal oldBasicSalary = s.getBasicSalary();
            
            s.setFullName(updated.getFullName());
            s.setPhone(updated.getPhone());
            s.setEmail(updated.getEmail());
            s.setAddress(updated.getAddress());
            s.setRole(updated.getRole());
            s.setDateOfBirth(updated.getDateOfBirth());
            s.setJoinedDate(updated.getJoinedDate());
            s.setBasicSalary(updated.getBasicSalary());
            s.setCommissionRate(updated.getCommissionRate());
            
            Staff savedStaff = staffRepo.save(s);
            
            // If basic salary changed, update future unpaid payroll records
            BigDecimal newBasicSalary = updated.getBasicSalary();
            if (newBasicSalary != null && oldBasicSalary != null && 
                newBasicSalary.compareTo(oldBasicSalary) != 0) {
                
                List<Payroll> unpaidPayrolls = payrollRepo.findByStaffId(id).stream()
                    .filter(p -> p.getStatus() == Payroll.Status.PENDING)
                    .collect(Collectors.toList());
                
                for (Payroll payroll : unpaidPayrolls) {
                    // Update basic salary and recalculate net salary
                    payroll.setBasicSalary(newBasicSalary.setScale(2, RoundingMode.HALF_UP));
                    BigDecimal newNet = newBasicSalary
                        .add(payroll.getCommission() != null ? payroll.getCommission() : BigDecimal.ZERO)
                        .add(payroll.getBonuses() != null ? payroll.getBonuses() : BigDecimal.ZERO)
                        .subtract(payroll.getDeductions() != null ? payroll.getDeductions() : BigDecimal.ZERO)
                        .setScale(2, RoundingMode.HALF_UP);
                    payroll.setNetSalary(newNet);
                }
                
                if (!unpaidPayrolls.isEmpty()) {
                    payrollRepo.saveAll(unpaidPayrolls);
                    log.info("Updated basic salary for {} unpaid payroll records of staff {}", 
                            unpaidPayrolls.size(), id);
                }
            }
            
            return ResponseEntity.ok(savedStaff);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return staffRepo.findById(id).map(s -> {
            Long pk = s.getId();
            taskRepo.deleteByAssignedToId(pk);
            staffAttRepo.deleteByStaffId(pk);
            payrollRepo.deleteByStaffId(pk);
            staffRepo.deleteById(pk);
            return ResponseEntity.ok(Map.of("message", "Deleted"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- STAFF ATTENDANCE ----
    @GetMapping("/{id}/attendance")
    public List<StaffAttendance> getAttendance(@PathVariable Long id) {
        return staffAttRepo.findByStaffId(id);
    }

    @GetMapping("/attendance/date/{date}")
    public List<StaffAttendanceResponseDTO> getAttendanceByDate(@PathVariable String date) {
        return staffAttRepo.findByDate(LocalDate.parse(date)).stream().map(att -> 
            new StaffAttendanceResponseDTO(
                att.getId(),
                att.getStaff() != null ? att.getStaff().getId() : null,
                att.getStaff() != null ? att.getStaff().getFullName() : null,
                att.getStaff() != null ? att.getStaff().getStaffId() : null,
                att.getDate(),
                att.getCheckIn(),
                att.getCheckOut(),
                att.getStatus() != null ? att.getStatus().name() : null,
                att.getNotes(),
                att.getCreatedAt()
            )
        ).toList();
    }

    @GetMapping("/attendance")
    public List<StaffAttendance> getAllAttendance() {
        return staffAttRepo.findAll();
    }

    @PostMapping("/attendance")
    public ResponseEntity<?> markAttendance(@RequestBody Map<String, Object> payload) {
        try {
            StaffAttendance att = new StaffAttendance();
            
            // Extract staffId and find staff
            if (payload.containsKey("staffId")) {
                Object staffIdObj = payload.get("staffId");
                if (staffIdObj instanceof Number) {
                    Long staffId = ((Number) staffIdObj).longValue();
                    Staff staff = staffRepo.findById(staffId).orElse(null);
                    if (staff == null) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Staff not found"));
                    }
                    att.setStaff(staff);
                } else {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid staffId format"));
                }
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "staffId is required"));
            }
            
            // Set other fields
            if (payload.containsKey("date")) {
                Object dateObj = payload.get("date");
                if (dateObj instanceof String) {
                    att.setDate(LocalDate.parse((String) dateObj));
                }
            }
            
            if (payload.containsKey("status")) {
                Object statusObj = payload.get("status");
                if (statusObj instanceof String) {
                    try {
                        att.setStatus(StaffAttendance.Status.valueOf((String) statusObj));
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Invalid status. Must be one of: PRESENT, ABSENT, HALF_DAY, LEAVE"));
                    }
                }
            }
            
            if (payload.containsKey("checkIn")) {
                Object checkInObj = payload.get("checkIn");
                if (checkInObj instanceof String) {
                    att.setCheckIn(LocalTime.parse((String) checkInObj));
                }
            }
            
            if (payload.containsKey("checkOut")) {
                Object checkOutObj = payload.get("checkOut");
                if (checkOutObj instanceof String) {
                    att.setCheckOut(LocalTime.parse((String) checkOutObj));
                }
            }
            
            if (payload.containsKey("notes")) {
                Object notesObj = payload.get("notes");
                if (notesObj instanceof String) {
                    att.setNotes((String) notesObj);
                }
            }
            
            return ResponseEntity.ok(staffAttRepo.save(att));
        } catch (Exception e) {
            log.error("Error marking staff attendance", e);
            return ResponseEntity.status(500).body(Map.of("message", "Internal server error: " + e.getMessage()));
        }
    }

    @PostMapping("/attendance/bulk")
    public ResponseEntity<?> markAttendanceBulk(@RequestBody List<StaffAttendanceBulkRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return ResponseEntity.ok(Map.of("message", "No attendance records to save", "saved", 0));
        }
        
        List<StaffAttendance> recordsToSave = new ArrayList<>();
        
        for (StaffAttendanceBulkRequest req : requests) {
            Staff staff = staffRepo.findById(req.staffId()).orElse(null);
            if (staff == null) continue;
            
            // Check if attendance already exists for this staff and date
            List<StaffAttendance> existingRecords = staffAttRepo.findByStaffIdAndDateBetween(
                req.staffId(), req.date(), req.date());
            
            if (existingRecords.isEmpty()) {
                // Create new record
                StaffAttendance attendance = new StaffAttendance();
                attendance.setStaff(staff);
                attendance.setDate(req.date());
                attendance.setStatus(req.getStatusEnum());
                attendance.setCreatedAt(java.time.LocalDateTime.now());
                recordsToSave.add(attendance);
            } else {
                // Update existing record
                StaffAttendance existing = existingRecords.get(0);
                existing.setStatus(req.getStatusEnum());
                existing.setCreatedAt(java.time.LocalDateTime.now());
                recordsToSave.add(existing);
            }
        }
        
        try {
            List<StaffAttendance> savedRecords = staffAttRepo.saveAll(recordsToSave);
            return ResponseEntity.ok(Map.of("message", "Attendance saved successfully", "saved", savedRecords.size()));
        } catch (Exception e) {
            log.error("Error saving bulk attendance", e);
            return ResponseEntity.status(500).body(Map.of("message", "Error saving attendance: " + e.getMessage()));
        }
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
    @Transactional
    public ResponseEntity<?> createPayroll(@RequestBody PayrollCreateRequest req) {
        try {
            if (req.staffId() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "staffId is required"));
            }

            Staff staff = staffRepo.findById(req.staffId()).orElse(null);
            if (staff == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Staff not found"));
            }

            int month = req.month() != null ? req.month() : LocalDate.now().getMonthValue();
            int year = req.year() != null ? req.year() : LocalDate.now().getYear();
            if (month < 1 || month > 12) {
                return ResponseEntity.badRequest().body(Map.of("message", "Month must be between 1 and 12"));
            }

            String payMonth = String.format("%02d", month);

            // Match SQL DECIMAL(10,2) scale to avoid SQL conversion problems.
            BigDecimal basic = (staff.getBasicSalary() != null ? staff.getBasicSalary() : BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal commission = (req.commission() != null ? req.commission() : BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal bonuses = (req.bonuses() != null ? req.bonuses() : BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal deductions = (req.deductions() != null ? req.deductions() : BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP);

            BigDecimal net = basic.add(commission).add(bonuses).subtract(deductions)
                    .setScale(2, RoundingMode.HALF_UP);

            Payroll payroll = payrollRepo
                    .findByStaffIdAndPayMonthAndPayYear(req.staffId(), payMonth, year)
                    .orElseGet(Payroll::new);

            payroll.setStaff(staff);
            payroll.setPayMonth(payMonth);
            payroll.setPayYear(year);
            payroll.setBasicSalary(basic);
            payroll.setCommission(commission);
            payroll.setBonuses(bonuses);
            payroll.setDeductions(deductions);
            payroll.setNetSalary(net);

            String note = req.notes();
            payroll.setNotes(note != null && !note.isBlank() ? note.trim() : null);

            if (payroll.getId() == null) {
                payroll.setStatus(Payroll.Status.PENDING);
            }

            return ResponseEntity.ok(payrollRepo.save(payroll));
        } catch (DataIntegrityViolationException e) {
            Throwable root = e.getMostSpecificCause();
            log.warn("createPayroll DB failure: {}", root != null ? root.getMessage() : e.getMessage());
            return ResponseEntity.status(409).body(Map.of(
                    "message", root != null ? root.getMessage() : "Database constraint failed"
            ));
        } catch (Exception e) {
            log.error("createPayroll failed", e);
            return ResponseEntity.status(500).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Internal server error"
            ));
        }
    }

    @GetMapping(value = "/payroll/{id}/payslip", produces = "text/html;charset=UTF-8")
    @Transactional(readOnly = true)
    public ResponseEntity<?> payslipHtml(@PathVariable Long id) {
        return payrollRepo.findById(id)
                .map(p -> {
                    Staff s = p.getStaff();
                    String staffName = esc(s.getFullName());
                    String staffCode = esc(s.getStaffId());
                    String monthLabel = formatPayMonthLabel(p.getPayMonth());
                    String fn = "payslip-" + safeFilename(s.getStaffId()) + "-" + p.getPayYear() + "-" + p.getPayMonth() + ".html";
                    String html = payslipDocumentHtml(p, staffName, staffCode, monthLabel);
                    return ResponseEntity.ok()
                            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fn + "\"")
                            .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
                            .body(html);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private static String esc(String raw) {
        if (raw == null) return "";
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static String safeFilename(String staffId) {
        if (staffId == null || staffId.isBlank()) return "staff";
        return staffId.replaceAll("[^a-zA-Z0-9._-]+", "_");
    }

    private static String formatPayMonthLabel(String payMonth) {
        if (payMonth == null || payMonth.isBlank()) return "";
        try {
            int m = Integer.parseInt(payMonth.trim());
            String n = Month.of(m).name();
            return n.charAt(0) + n.substring(1).toLowerCase();
        } catch (Exception e) {
            return esc(payMonth);
        }
    }

    private static String payslipDocumentHtml(Payroll p, String staffName, String staffCode, String monthLabel) {
        String notes = p.getNotes() != null ? esc(p.getNotes()) : "";
        String status = p.getStatus() != null ? p.getStatus().name() : "";
        String paid = p.getPaidDate() != null ? p.getPaidDate().toString() : "—";
        return "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\"><title>Payslip</title>"
                + "<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:24px;"
                + "color:#111}h1{font-size:1.25rem}table{width:100%;border-collapse:collapse;margin-top:16px}"
                + "th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f5f5f5}"
                + ".net{font-size:1.15rem;font-weight:700}.muted{color:#666;font-size:0.9rem}</style></head><body>"
                + "<h1>Salary payslip</h1>"
                + "<p class=\"muted\">Period: " + esc(monthLabel) + " " + p.getPayYear() + "</p>"
                + "<p><strong>Staff:</strong> " + staffName + " <span class=\"muted\">(" + staffCode + ")</span></p>"
                + "<table><tr><th>Description</th><th>Amount (Rs.)</th></tr>"
                + "<tr><td>Basic salary</td><td>" + p.getBasicSalary() + "</td></tr>"
                + "<tr><td>Commission</td><td>" + p.getCommission() + "</td></tr>"
                + "<tr><td>Bonuses</td><td>" + p.getBonuses() + "</td></tr>"
                + "<tr><td>Deductions</td><td>-" + p.getDeductions() + "</td></tr>"
                + "<tr><td class=\"net\">Net salary</td><td class=\"net\">" + p.getNetSalary() + "</td></tr></table>"
                + "<p><strong>Status:</strong> " + esc(status) + " &nbsp;|&nbsp; <strong>Paid date:</strong> " + esc(paid) + "</p>"
                + (notes.isEmpty() ? "" : "<p><strong>Notes:</strong> " + notes + "</p>")
                + "</body></html>";
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

        if (staff.getFullName() == null || staff.getFullName().isBlank()) {
            return "Full name is required";
        }
        String fullName = staff.getFullName().trim();
        if (fullName.length() < 2) {
            return "Full name must be at least 2 characters";
        }
        if (fullName.length() > 100) {
            return "Full name must be at most 100 characters";
        }
        if (!FULLNAME_ALLOWED.matcher(fullName).matches()) {
            return "Full name cannot contain symbols. Use letters and spaces only.";
        }
        staff.setFullName(fullName);

        if (staff.getRole() == null) {
            return "Role is required";
        }

        String phone = staff.getPhone();
        if (phone == null || phone.isBlank()) {
            return "Phone is required";
        }
        String phoneDigits = DIGITS_ONLY.matcher(phone.trim()).replaceAll("");
        if (phoneDigits.length() != 10) {
            return "Phone must be exactly 10 digits";
        }
        staff.setPhone(phoneDigits);

        String email = staff.getEmail();
        if (email != null && !email.isBlank()) {
            String e = email.trim();
            if (e.length() > 100) {
                return "Email must be at most 100 characters";
            }
            if (!EMAIL_PATTERN.matcher(e).matches()) {
                return "Invalid email format";
            }
            staff.setEmail(e);
        } else {
            staff.setEmail(null);
        }

        BigDecimal salary = staff.getBasicSalary();
        if (salary != null) {
            if (salary.compareTo(BigDecimal.ZERO) < 0) {
                return "Basic salary cannot be negative";
            }
            if (salary.scale() > 2) {
                staff.setBasicSalary(salary.setScale(2, RoundingMode.HALF_UP));
            }
        }

        BigDecimal commission = staff.getCommissionRate();
        if (commission != null) {
            if (commission.compareTo(BigDecimal.ZERO) < 0 || commission.compareTo(COMMISSION_MAX) > 0) {
                return "Commission rate must be between 0 and 100";
            }
            if (commission.scale() > 2) {
                staff.setCommissionRate(commission.setScale(2, RoundingMode.HALF_UP));
            }
        }

        String address = staff.getAddress();
        if (address != null && address.length() > 4000) {
            return "Address is too long (max 4000 characters)";
        }

        String nic = staff.getNic();
        if (nic != null && nic.isBlank()) {
            staff.setNic(null);
        } else if (nic != null) {
            String n = nic.trim();
            if (n.length() > 20) {
                return "NIC must be at most 20 characters";
            }
            staff.setNic(n);
        }

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
