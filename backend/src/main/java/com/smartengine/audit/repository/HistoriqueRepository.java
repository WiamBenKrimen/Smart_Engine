package com.smartengine.audit.repository;

import com.smartengine.audit.entity.Historique;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoriqueRepository extends JpaRepository<Historique, Long> {
}
