package com.tuition.repository;

import com.tuition.model.StaffAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {
    List<StaffAttendance> findByStaffId(Long staffId);
    List<StaffAttendance> findByDate(LocalDate date);
    List<StaffAttendance> findByStaffIdAndDateBetween(Long staffId, LocalDate from, LocalDate to);
}
