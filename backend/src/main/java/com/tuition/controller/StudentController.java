package com.tuition.controller;

import com.tuition.model.Attendance;
import com.tuition.model.Enrollment;
import com.tuition.model.Result;
import com.tuition.model.Student;
import com.tuition.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/students")
public class StudentController {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^[+]?[0-9]{9,15}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Autowired private StudentRepository    studentRepo;
    @Autowired private EnrollmentRepository enrollmentRepo;
    @Autowired private AttendanceRepository attendanceRepo;
    @Autowired private ResultRepository     resultRepo;
    @Autowired private BatchRepository      batchRepo;

    // ---- CRUD ----
    @GetMapping
    public List<Student> getAll() { return studentRepo.findByIsActiveTrue(); }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getById(@PathVariable Long id) {
        return studentRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Student student) {
        String validationMessage = validateStudent(student, true);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        // Auto-generate student ID
        String sid = generateStudentId();
        student.setStudentId(sid);
        return ResponseEntity.ok(studentRepo.save(student));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Student updated) {
        String validationMessage = validateStudent(updated, false);
        if (validationMessage != null) {
            return ResponseEntity.badRequest().body(Map.of("message", validationMessage));
        }

        return studentRepo.findById(id).map(s -> {
            s.setFullName(updated.getFullName());
            s.setPhone(updated.getPhone());
            s.setEmail(updated.getEmail());
            s.setAddress(updated.getAddress());
            s.setSchool(updated.getSchool());
            s.setAlYear(updated.getAlYear());
            s.setDateOfBirth(updated.getDateOfBirth());
            s.setParentName(updated.getParentName());
            s.setParentPhone(updated.getParentPhone());
            s.setIntakeSource(updated.getIntakeSource());
            return ResponseEntity.ok(studentRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return studentRepo.findById(id).map(s -> {
            s.setIsActive(false);
            studentRepo.save(s);
            return ResponseEntity.ok(Map.of("message", "Student deactivated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- ENROLLMENTS ----
    @GetMapping("/{id}/batches")
    public List<Enrollment> getEnrollments(@PathVariable Long id) {
        return enrollmentRepo.findByStudentId(id);
    }

    @PostMapping("/{id}/enroll")
    public ResponseEntity<?> enroll(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long batchId = body.get("batchId");
        if (batchId == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Batch is required"));
        }

        if (!studentRepo.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message", "Student not found"));
        }

        if (!batchRepo.existsById(batchId)) {
            return ResponseEntity.status(404).body(Map.of("message", "Batch not found"));
        }

        if (enrollmentRepo.existsByStudentIdAndBatchId(id, batchId))
            return ResponseEntity.badRequest().body(Map.of("message", "Already enrolled"));
        Student student = studentRepo.findById(id).orElseThrow();
        var batch       = batchRepo.findById(batchId).orElseThrow();
        Enrollment e    = new Enrollment();
        e.setStudent(student);
        e.setBatch(batch);
        e.setEnrolledDate(LocalDate.now());
        return ResponseEntity.ok(enrollmentRepo.save(e));
    }

    // ---- ATTENDANCE ----
    @GetMapping("/{id}/attendance")
    public List<Attendance> getAttendance(@PathVariable Long id) {
        return attendanceRepo.findByStudentIdAndDateBetween(id,
                LocalDate.now().minusMonths(3), LocalDate.now());
    }

    // ---- RESULTS ----
    @GetMapping("/{id}/results")
    public List<Result> getResults(@PathVariable Long id) {
        return resultRepo.findByStudentId(id);
    }

    // ---- STATS ----
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        return Map.of(
            "totalStudents", studentRepo.countByIsActiveTrue(),
            "allStudents",   studentRepo.count()
        );
    }

    private String validateStudent(Student student, boolean creating) {
        if (student == null) return "Invalid request body";

        String fullName = normalize(student.getFullName());
        if (fullName == null || fullName.length() < 3) {
            return "Full name must be at least 3 characters";
        }

        String phone = normalize(student.getPhone());
        if (phone == null || !PHONE_PATTERN.matcher(phone).matches()) {
            return "Phone number must be 9 to 15 digits";
        }

        if (creating && student.getGender() == null) {
            return "Gender is required";
        }

        String email = normalize(student.getEmail());
        if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
            return "Invalid email format";
        }

        Integer alYear = student.getAlYear();
        if (alYear != null && (alYear < 2000 || alYear > 2100)) {
            return "A/L year must be between 2000 and 2100";
        }

        String parentPhone = normalize(student.getParentPhone());
        if (parentPhone != null && !PHONE_PATTERN.matcher(parentPhone).matches()) {
            return "Parent phone number must be 9 to 15 digits";
        }

        if (student.getDateOfBirth() != null && student.getDateOfBirth().isAfter(LocalDate.now())) {
            return "Date of birth cannot be in the future";
        }

        student.setFullName(fullName);
        student.setPhone(phone);
        student.setEmail(email);
        student.setParentPhone(parentPhone);
        student.setParentName(normalize(student.getParentName()));
        student.setSchool(normalize(student.getSchool()));
        student.setAddress(normalize(student.getAddress()));
        student.setIntakeSource(normalize(student.getIntakeSource()));

        return null;
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String generateStudentId() {
        long next = studentRepo.count() + 1;
        String candidate = "STU" + String.format("%04d", next);
        Optional<Student> existing = studentRepo.findByStudentId(candidate);
        while (existing.isPresent()) {
            next++;
            candidate = "STU" + String.format("%04d", next);
            existing = studentRepo.findByStudentId(candidate);
        }
        return candidate;
    }
}
