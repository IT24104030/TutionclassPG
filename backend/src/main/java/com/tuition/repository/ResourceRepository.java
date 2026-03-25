package com.tuition.repository;

import com.tuition.model.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    List<Resource> findByResourceType(Resource.ResourceType resourceType);
    List<Resource> findByIsRestrictedFalse();
    List<Resource> findByBatchesId(Long batchId);
}
