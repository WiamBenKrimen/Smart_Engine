package com.smartengine.audit.repository;

import com.smartengine.audit.entity.Historique;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoriqueRepository extends JpaRepository<Historique, Long> {

    @Query("SELECT h FROM Historique h LEFT JOIN FETCH h.demande LEFT JOIN FETCH h.utilisateur LEFT JOIN FETCH h.espace LEFT JOIN FETCH h.tache ORDER BY h.dateAction DESC")
    List<Historique> findAllWithRelations();
}
