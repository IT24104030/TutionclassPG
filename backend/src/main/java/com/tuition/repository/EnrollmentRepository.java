package com.tuition.repository;

import com.tuition.model.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByStudentId(Long studentId);
    List<Enrollment> findByBatchId(Long batchId);
    boolean existsByStudentIdAndBatchId(Long studentId, Long batchId);
    long countByBatchIdAndStatus(Long batchId, Enrollment.Status status);
}
