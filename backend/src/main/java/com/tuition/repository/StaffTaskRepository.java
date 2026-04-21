package com.tuition.repository;

import com.tuition.model.StaffTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StaffTaskRepository extends JpaRepository<StaffTask, Long> {
    List<StaffTask> findByAssignedToId(Long staffId);
    List<StaffTask> findByStatus(StaffTask.Status status);
    List<StaffTask> findByAssignedToIdAndStatus(Long staffId, StaffTask.Status status);
    void deleteByAssignedToId(Long staffId);
}
