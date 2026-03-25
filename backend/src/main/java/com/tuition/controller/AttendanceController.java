package com.tuition.controller;

import com.tuition.model.Attendance;
import com.tuition.repository.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired private AttendanceRepository attendanceRepo;

    @GetMapping
    public List<Attendance> getAll() { return attendanceRepo.findAll(); }

    @GetMapping("/student/{studentId}")
    public List<Attendance> getByStudent(@PathVariable Long studentId) {
        return attendanceRepo.findByStudentIdAndDateBetween(studentId,
                LocalDate.now().minusMonths(6), LocalDate.now());
    }

    @GetMapping("/batch/{batchId}/date/{date}")
    public List<Attendance> getByBatchAndDate(@PathVariable Long batchId,
                                              @PathVariable String date) {
        return attendanceRepo.findByBatchIdAndDate(batchId, LocalDate.parse(date));
    }

    @PostMapping
    public ResponseEntity<Attendance> mark(@RequestBody Attendance attendance) {
        return ResponseEntity.ok(attendanceRepo.save(attendance));
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> markBulk(@RequestBody List<Attendance> records) {
        return ResponseEntity.ok(attendanceRepo.saveAll(records));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Attendance> update(@PathVariable Long id,
                                             @RequestBody Attendance updated) {
        return attendanceRepo.findById(id).map(a -> {
            a.setStatus(updated.getStatus());
            a.setNotes(updated.getNotes());
            return ResponseEntity.ok(attendanceRepo.save(a));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        attendanceRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }

    @GetMapping("/student/{studentId}/batch/{batchId}/percentage")
    public Map<String, Object> getPercentage(@PathVariable Long studentId,
                                             @PathVariable Long batchId) {
        long present = attendanceRepo.countPresent(studentId, batchId);
        long total   = attendanceRepo.countTotal(studentId, batchId);
        double pct   = total > 0 ? (double) present / total * 100 : 0;
        return Map.of("present", present, "total", total,
                      "percentage", Math.round(pct * 10.0) / 10.0);
    }
}
