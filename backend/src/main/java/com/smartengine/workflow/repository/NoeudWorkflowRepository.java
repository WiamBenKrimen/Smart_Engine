package com.smartengine.workflow.repository;

import com.smartengine.workflow.entity.NoeudWorkflow;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoeudWorkflowRepository extends JpaRepository<NoeudWorkflow, Long> {
    List<NoeudWorkflow> findByWorkflow_Id(Long workflowId);
    void deleteByWorkflow_Id(Long workflowId);
    Optional<NoeudWorkflow> findByWorkflow_IdAndCleNoeud(Long workflowId, String cleNoeud);
}
