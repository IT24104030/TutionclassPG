package com.tuition.controller;

import com.tuition.model.Result;
import com.tuition.repository.ResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/results")
public class ResultController {

    @Autowired private ResultRepository resultRepo;

    @GetMapping
    public List<Result> getAll() { return resultRepo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Result> getById(@PathVariable Long id) {
        return resultRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/student/{studentId}")
    public List<Result> getByStudent(@PathVariable Long studentId) {
        return resultRepo.findByStudentId(studentId);
    }

    @GetMapping("/batch/{batchId}")
    public List<Result> getByBatch(@PathVariable Long batchId) {
        return resultRepo.findByBatchId(batchId);
    }

    @GetMapping("/student/{studentId}/batch/{batchId}")
    public List<Result> getByStudentAndBatch(@PathVariable Long studentId,
                                              @PathVariable Long batchId) {
        return resultRepo.findByStudentIdAndBatchId(studentId, batchId);
    }

    @PostMapping
    public ResponseEntity<Result> create(@RequestBody Result result) {
        // Auto-calculate grade
        if (result.getMarksObtained() != null && result.getTotalMarks() != null) {
            double pct = result.getMarksObtained().doubleValue() /
                         result.getTotalMarks().doubleValue() * 100;
            result.setGrade(
                pct >= 75 ? "A" : pct >= 65 ? "B" : pct >= 55 ? "C" :
                pct >= 35 ? "S" : "F"
            );
        }
        return ResponseEntity.ok(resultRepo.save(result));
    }

    @PostMapping("/bulk")
    public ResponseEntity<?> createBulk(@RequestBody List<Result> results) {
        results.forEach(r -> {
            if (r.getMarksObtained() != null && r.getTotalMarks() != null) {
                double pct = r.getMarksObtained().doubleValue() /
                             r.getTotalMarks().doubleValue() * 100;
                r.setGrade(
                    pct >= 75 ? "A" : pct >= 65 ? "B" : pct >= 55 ? "C" :
                    pct >= 35 ? "S" : "F"
                );
            }
        });
        return ResponseEntity.ok(resultRepo.saveAll(results));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Result> update(@PathVariable Long id, @RequestBody Result updated) {
        return resultRepo.findById(id).map(r -> {
            r.setExamName(updated.getExamName());
            r.setMarksObtained(updated.getMarksObtained());
            r.setTotalMarks(updated.getTotalMarks());
            r.setRemarks(updated.getRemarks());
            // Recalculate grade
            if (updated.getMarksObtained() != null && updated.getTotalMarks() != null) {
                double pct = updated.getMarksObtained().doubleValue() /
                             updated.getTotalMarks().doubleValue() * 100;
                r.setGrade(pct >= 75 ? "A" : pct >= 65 ? "B" : pct >= 55 ? "C" :
                            pct >= 35 ? "S" : "F");
            }
            return ResponseEntity.ok(resultRepo.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        resultRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }
}
