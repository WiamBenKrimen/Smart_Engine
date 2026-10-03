package com.smartengine.request.repository;

import com.smartengine.request.entity.Demande;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandeRepository extends JpaRepository<Demande, Long> {
    Optional<Demande> findByReferenceDemande(String referenceDemande);
}
