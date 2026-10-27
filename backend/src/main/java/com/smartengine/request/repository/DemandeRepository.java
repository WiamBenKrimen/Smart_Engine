package com.smartengine.request.repository;

import com.smartengine.request.entity.Demande;
import com.smartengine.request.entity.StatutDemande;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DemandeRepository extends JpaRepository<Demande, Long> {
    Optional<Demande> findByReferenceDemande(String referenceDemande);

    List<Demande> findByCreePar_EmailOrderByDateCreationDesc(String email);

    long countByCreePar_EmailAndStatut(String email, StatutDemande statut);

    long countByCreePar_Email(String email);
}
