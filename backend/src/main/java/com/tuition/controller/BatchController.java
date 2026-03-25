package com.tuition.controller;

import com.tuition.model.Attendance;
import com.tuition.model.Batch;
import com.tuition.model.Result;
import com.tuition.model.Subject;
import com.tuition.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/batches")
public class BatchController {

    @Autowired private BatchRepository      batchRepo;
    @Autowired private SubjectRepository    subjectRepo;
    @Autowired private AttendanceRepository attendanceRepo;
    @Autowired private ResultRepository     resultRepo;
    @Autowired private EnrollmentRepository enrollmentRepo;

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return batchRepo.findByIsActiveTrue().stream().map(this::toBatchDto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        return batchRepo.findById(id).map(batch -> ResponseEntity.ok(toBatchDto(batch)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Batch> create(@RequestBody Batch batch) {
        return ResponseEntity.ok(batchRepo.save(batch));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Batch> update(@PathVariable Long id, @RequestBody Batch updated) {
        return batchRepo.findById(id).map(b -> {
            b.setBatchName(updated.getBatchName());
            b.setYear(updated.getYear());
            b.setMedium(updated.getMedium());
            b.setMaxStudents(updated.getMaxStudents());
            b.setFeeAmount(updated.getFeeAmount());
            return ResponseEntity.ok(batchRepo.save(b));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        return batchRepo.findById(id).map(b -> {
            b.setIsActive(false);
            batchRepo.save(b);
            return ResponseEntity.ok(Map.of("message","Deactivated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---- ATTENDANCE FOR BATCH ----
    @GetMapping("/{id}/attendance")
    public List<Attendance> getBatchAttendance(@PathVariable Long id,
                                               @RequestParam(required = false) String date) {
        if (date != null)
            return attendanceRepo.findByBatchIdAndDate(id, LocalDate.parse(date));
        return attendanceRepo.findByStudentIdAndBatchId(null, id);
    }

    @PostMapping("/{id}/attendance")
    public ResponseEntity<?> markAttendance(@PathVariable Long id,
                                            @RequestBody List<Attendance> records) {
        records.forEach(a -> a.getBatch().setId(id));
        return ResponseEntity.ok(attendanceRepo.saveAll(records));
    }

    // ---- RESULTS FOR BATCH ----
    @GetMapping("/{id}/results")
    public List<Result> getBatchResults(@PathVariable Long id) {
        return resultRepo.findByBatchId(id);
    }

    @PostMapping("/{id}/results")
    public ResponseEntity<Result> addResult(@PathVariable Long id, @RequestBody Result result) {
        result.getBatch().setId(id);
        return ResponseEntity.ok(resultRepo.save(result));
    }

    // ---- SUBJECTS ----
    @GetMapping("/subjects")
    public List<Subject> getSubjects() { return subjectRepo.findAll(); }

    @PostMapping("/subjects")
    public ResponseEntity<Subject> createSubject(@RequestBody Subject subject) {
        return ResponseEntity.ok(subjectRepo.save(subject));
    }

    private Map<String, Object> toBatchDto(Batch batch) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", batch.getId());
        dto.put("batchName", batch.getBatchName());
        dto.put("year", batch.getYear());
        dto.put("medium", batch.getMedium());
        dto.put("maxStudents", batch.getMaxStudents());
        dto.put("feeAmount", batch.getFeeAmount());
        dto.put("isActive", batch.getIsActive());

        Subject subject = batch.getSubject();
        if (subject != null) {
            dto.put("subject", Map.of(
                    "id", subject.getId(),
                    "name", subject.getName(),
                    "code", subject.getCode()
            ));
        } else {
            dto.put("subject", null);
        }
        return dto;
    }
}
