package com.tuition.controller;

import com.tuition.model.Campaign;
import com.tuition.repository.CampaignRepository;
import com.tuition.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/marketing")
public class MarketingController {

    @Autowired private CampaignRepository campaignRepo;
    @Autowired private StudentRepository  studentRepo;

    // ---- CAMPAIGNS ----
    @GetMapping("/campaigns")
    public List<Campaign> getAllCampaigns() { return campaignRepo.findAll(); }

    @GetMapping("/campaigns/{id}")
    public ResponseEntity<Campaign> getCampaign(@PathVariable Long id) {
        return campaignRepo.findById(id).map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/campaigns")
    public ResponseEntity<Campaign> createCampaign(@Valid @RequestBody Campaign campaign) {
        return ResponseEntity.ok(campaignRepo.save(campaign));
    }

    @PutMapping("/campaigns/{id}")
    public ResponseEntity<Campaign> updateCampaign(@PathVariable Long id,
                                                   @Valid @RequestBody Campaign updated) {
        return campaignRepo.findById(id).map(c -> {
            c.setCampaignName(updated.getCampaignName());
            c.setPlatform(updated.getPlatform());
            c.setStartDate(updated.getStartDate());
            c.setEndDate(updated.getEndDate());
            c.setBudget(updated.getBudget());
            c.setDescription(updated.getDescription());
            c.setStatus(updated.getStatus());
            return ResponseEntity.ok(campaignRepo.save(c));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/campaigns/{id}")
    public ResponseEntity<?> deleteCampaign(@PathVariable Long id) {
        campaignRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message","Deleted"));
    }

    // ---- INTAKE SOURCE ANALYTICS ----
    @GetMapping("/intake-sources")
    public List<Map<String, Object>> intakeSourceStats() {
        Map<String, Long> stats = studentRepo.findByIsActiveTrue().stream()
                .filter(s -> s.getIntakeSource() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getIntakeSource(),
                        Collectors.counting()));

        List<Map<String, Object>> response = new ArrayList<>();
        stats.forEach((source, count) -> response.add(Map.of(
                "source", source,
                "count", count
        )));
        return response;
    }

    // ---- ENROLLMENT TRENDS ----
    @GetMapping("/enrollment-trends")
    public Map<String, Object> enrollmentTrends() {
        var students = studentRepo.findAll();
        Map<String, Long> monthlyTrends = students.stream()
                .filter(s -> s.getRegisteredAt() != null)
                .collect(Collectors.groupingBy(
                        s -> s.getRegisteredAt().getYear() + "-" +
                             String.format("%02d", s.getRegisteredAt().getMonthValue()),
                        Collectors.counting()));
        return Map.of(
            "trends",       monthlyTrends,
            "totalStudents", students.size()
        );
    }
}
