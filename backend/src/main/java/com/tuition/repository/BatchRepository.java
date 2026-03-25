package com.tuition.repository;

import com.tuition.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByIsActiveTrue();
    List<Batch> findBySubjectId(Long subjectId);
    List<Batch> findByYear(Integer year);
}
