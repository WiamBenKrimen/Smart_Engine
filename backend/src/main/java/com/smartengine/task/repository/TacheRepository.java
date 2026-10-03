package com.smartengine.task.repository;

import com.smartengine.task.entity.Tache;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TacheRepository extends JpaRepository<Tache, Long> {
}
