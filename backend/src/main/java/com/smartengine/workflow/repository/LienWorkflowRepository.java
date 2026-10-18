package com.smartengine.workflow.repository;

import com.smartengine.workflow.entity.LienWorkflow;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LienWorkflowRepository extends JpaRepository<LienWorkflow, Long> {
    List<LienWorkflow> findByWorkflow_Id(Long workflowId);
    void deleteByWorkflow_Id(Long workflowId);
}
