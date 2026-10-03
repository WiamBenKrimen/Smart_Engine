package com.smartengine.workspace.repository;

import com.smartengine.workspace.entity.MembreEspace;
import com.smartengine.workspace.entity.MembreEspaceId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembreEspaceRepository extends JpaRepository<MembreEspace, MembreEspaceId> {
    List<MembreEspace> findByUtilisateur_Id(Long utilisateurId);
}
