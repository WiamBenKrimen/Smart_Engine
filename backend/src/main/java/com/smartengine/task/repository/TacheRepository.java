package com.smartengine.task.repository;

import com.smartengine.task.entity.StatutTache;
import com.smartengine.task.entity.Tache;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TacheRepository extends JpaRepository<Tache, Long> {

    List<Tache> findByAttribueA_EmailOrderByDateCreationDesc(String email);

    List<Tache> findByAttribueA_IdOrderByDateCreationDesc(Long userId);

    List<Tache> findByEspace_IdOrderByDateCreationDesc(Long espaceId);

    List<Tache> findByInstance_Demande_IdOrderByDateCreationDesc(Long demandeId);

    long countByAttribueA_EmailAndStatut(String email, StatutTache statut);

    @Query("SELECT t FROM Tache t LEFT JOIN t.attribueA u WHERE u.email = :email OR (t.attribueA IS NULL AND t.espace.id IN :espaceIds) ORDER BY t.dateCreation DESC")
    List<Tache> findAssignedOrClaimable(@Param("email") String email, @Param("espaceIds") List<Long> espaceIds);
}
