package com.smartengine.integration.n8n.repository;

import com.smartengine.integration.n8n.entity.N8nLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface N8nLogRepository extends JpaRepository<N8nLog, Long> {
}
