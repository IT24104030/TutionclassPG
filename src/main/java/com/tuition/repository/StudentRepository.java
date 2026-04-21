package com.tuition.repository;

import com.tuition.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByStudentId(String studentId);
    List<Student> findByIsActiveTrue();
    List<Student> findByIntakeSource(String intakeSource);
    long countByIsActiveTrue();
}
