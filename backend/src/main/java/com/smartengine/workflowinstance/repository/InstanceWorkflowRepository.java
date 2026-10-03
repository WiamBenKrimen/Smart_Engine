package com.smartengine.workflowinstance.repository;

import com.smartengine.workflowinstance.entity.InstanceWorkflow;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InstanceWorkflowRepository extends JpaRepository<InstanceWorkflow, Long> {
}
