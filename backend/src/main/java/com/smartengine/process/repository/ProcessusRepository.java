package com.smartengine.process.repository;

import com.smartengine.process.entity.Processus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessusRepository extends JpaRepository<Processus, Long> {
}
