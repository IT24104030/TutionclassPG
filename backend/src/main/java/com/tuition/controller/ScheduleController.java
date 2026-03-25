package com.tuition.controller;

import com.tuition.model.Schedule;
import com.tuition.repository.ScheduleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/schedules")
public class ScheduleController {

    @Autowired private ScheduleRepository scheduleRepo;

    @GetMapping
    public List<Schedule> getAll() { return scheduleRepo.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getById(@PathVariable Long id) {
        return scheduleRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batch/{batchId}")
    public List<Schedule> getByBatch(@PathVariable Long batchId) {
        return scheduleRepo.findByBatchId(batchId);
    }

    @GetMapping("/today")
    public List<Schedule> getToday() {
        return scheduleRepo.findByClassDate(LocalDate.now());
    }

    @GetMapping("/week")
    public List<Schedule> getWeek() {
        return scheduleRepo.findByClassDateBetween(LocalDate.now(),
                LocalDate.now().plusDays(7));
    }

    @GetMapping("/date-range")
    public List<Schedule> getByRange(@RequestParam String from, @RequestParam String to) {
        return scheduleRepo.findByClassDateBetween(LocalDate.parse(from), LocalDate.parse(to));
    }

    @PostMapping
    public ResponseEntity<Schedule> create(@RequestBody Schedule schedule) {
        return ResponseEntity.ok(scheduleRepo.save(schedule));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> update(@PathVariable Long id, @RequestBody Schedule updated) {
        return scheduleRepo.findById(id).map(s -> {
            s.setTitle(updated.getTitle());
            s.setClassType(updated.getClassType());
            s.setClassDate(updated.getClassDate());
            s.setStartTime(updated.getStartTime());
            s.setEndTime(updated.getEndTime());
            s.setLocation(updated.getLocation());
            s.setOnlineLink(updated.getOnlineLink());
            s.setStatus(updated.getStatus());
            s.setNotes(updated.getNotes());
            return ResponseEntity.ok(scheduleRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Schedule> cancel(@PathVariable Long id) {
        return scheduleRepo.findById(id).map(s -> {
            s.setStatus(Schedule.Status.CANCELLED);
            return ResponseEntity.ok(scheduleRepo.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        scheduleRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }
}
