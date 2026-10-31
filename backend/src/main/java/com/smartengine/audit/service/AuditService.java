package com.smartengine.audit.service;

import com.smartengine.audit.dto.AuditLogResponse;
import com.smartengine.audit.entity.Historique;
import com.smartengine.audit.repository.HistoriqueRepository;
import com.smartengine.request.entity.Demande;
import com.smartengine.task.entity.Tache;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.workspace.entity.Espace;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final HistoriqueRepository historiqueRepository;

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return historiqueRepository.findAllWithRelations()
                .stream()
                .map(AuditLogResponse::from)
                .toList();
    }

    @Transactional
    public Historique log(Demande demande, Utilisateur utilisateur, Espace espace, Tache tache, String action, String details) {
        Historique h = new Historique();
        h.setDemande(demande);
        h.setUtilisateur(utilisateur);
        h.setEspace(espace);
        h.setTache(tache);
        h.setAction(action);
        h.setDetails(details);
        h.setDateAction(LocalDateTime.now());
        return historiqueRepository.save(h);
    }
}
