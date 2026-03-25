package com.tuition.repository;

import com.tuition.model.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {
    Optional<Staff> findByStaffId(String staffId);
    List<Staff> findByIsActiveTrue();
    List<Staff> findByRole(Staff.StaffRole role);
    long countByIsActiveTrue();
}
