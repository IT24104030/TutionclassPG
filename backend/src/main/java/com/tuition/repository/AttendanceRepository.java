package com.tuition.repository;

import com.tuition.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentIdAndBatchId(Long studentId, Long batchId);
    List<Attendance> findByBatchIdAndDate(Long batchId, LocalDate date);
    List<Attendance> findByStudentIdAndDateBetween(Long studentId, LocalDate from, LocalDate to);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = ?1 AND a.batch.id = ?2 AND a.status = 'PRESENT'")
    long countPresent(Long studentId, Long batchId);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.student.id = ?1 AND a.batch.id = ?2")
    long countTotal(Long studentId, Long batchId);
}
