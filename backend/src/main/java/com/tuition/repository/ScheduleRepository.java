package com.tuition.repository;

import com.tuition.model.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByBatchId(Long batchId);
    List<Schedule> findByClassDate(LocalDate date);
    List<Schedule> findByClassDateBetween(LocalDate from, LocalDate to);
    List<Schedule> findByBatchIdAndClassDateBetween(Long batchId, LocalDate from, LocalDate to);
    List<Schedule> findByStatus(Schedule.Status status);

}
