package com.smartengine.workspace.repository;

import com.smartengine.workspace.entity.Espace;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EspaceRepository extends JpaRepository<Espace, Long> {
    Optional<Espace> findByCode(String code);
}
