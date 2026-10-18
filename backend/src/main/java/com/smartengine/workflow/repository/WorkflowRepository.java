package com.smartengine.workflow.repository;

import com.smartengine.workflow.entity.Workflow;
import com.smartengine.workflow.entity.WorkflowStatut;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    List<Workflow> findByStatut(WorkflowStatut statut);
    List<Workflow> findAllByOrderByDateCreationDesc();
}
