package com.tuition.repository;

import com.tuition.model.Result;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {
    List<Result> findByStudentId(Long studentId);
    List<Result> findByBatchId(Long batchId);
    List<Result> findByStudentIdAndBatchId(Long studentId, Long batchId);
    List<Result> findByExamType(Result.ExamType examType);
}
