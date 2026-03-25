package com.tuition.repository;

import com.tuition.model.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByStatus(Campaign.Status status);
    List<Campaign> findByPlatform(Campaign.Platform platform);
}
