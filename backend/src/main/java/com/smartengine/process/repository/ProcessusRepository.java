package com.smartengine.process.repository;

import com.smartengine.process.entity.Processus;
import com.smartengine.workflow.entity.WorkflowStatut;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessusRepository extends JpaRepository<Processus, Long> {
    List<Processus> findByStatut(WorkflowStatut statut);
    List<Processus> findAllByOrderByDateCreationDesc();
}
