package com.smartengine.request.service;

import com.smartengine.process.entity.Processus;
import com.smartengine.process.repository.ProcessusRepository;
import com.smartengine.request.dto.DemandeRequest;
import com.smartengine.request.dto.DemandeResponse;
import com.smartengine.request.dto.EmployeeDashboardResponse;
import com.smartengine.request.entity.Demande;
import com.smartengine.request.entity.StatutDemande;
import com.smartengine.request.repository.DemandeRepository;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RequestService {

    private final DemandeRepository demandeRepository;
    private final ProcessusRepository processusRepository;
    private final UtilisateurRepository utilisateurRepository;

    public RequestService(DemandeRepository demandeRepository,
                          ProcessusRepository processusRepository,
                          UtilisateurRepository utilisateurRepository) {
        this.demandeRepository = demandeRepository;
        this.processusRepository = processusRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    /** Retourne toutes les demandes de l'employé connecté, triées par date desc. */
    @Transactional(readOnly = true)
    public List<DemandeResponse> getMesDemandes(String email) {
        return demandeRepository.findByCreePar_EmailOrderByDateCreationDesc(email)
                .stream()
                .map(DemandeResponse::from)
                .toList();
    }

    /** Retourne le détail d'une demande (vérifie que l'auteur correspond). */
    @Transactional(readOnly = true)
    public DemandeResponse getById(Long id, String email) {
        Demande demande = demandeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Demande introuvable : " + id));
        if (!demande.getCreePar().getEmail().equals(email)) {
            throw new EntityNotFoundException("Demande introuvable : " + id);
        }
        return DemandeResponse.from(demande);
    }

    /** Crée et soumet une nouvelle demande. */
    @Transactional
    public DemandeResponse create(DemandeRequest req, String email) {
        Utilisateur employe = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable : " + email));

        Processus processus = processusRepository.findById(req.processusId())
                .orElseThrow(() -> new EntityNotFoundException("Processus introuvable : " + req.processusId()));

        Demande demande = new Demande();
        demande.setReferenceDemande(generateReference());
        demande.setProcessus(processus);
        demande.setCreePar(employe);
        demande.setStatut(StatutDemande.EN_COURS);
        demande.setDataJson(req.dataJson());
        demande.setDateCreation(LocalDateTime.now());

        return DemandeResponse.from(demandeRepository.save(demande));
    }

    /** Retourne les KPIs du tableau de bord de l'employé. */
    @Transactional(readOnly = true)
    public EmployeeDashboardResponse getDashboard(String email) {
        long total     = demandeRepository.countByCreePar_Email(email);
        long enCours   = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.EN_COURS);
        long terminees = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.TERMINEE);
        long refusees  = demandeRepository.countByCreePar_EmailAndStatut(email, StatutDemande.REFUSEE);
        return new EmployeeDashboardResponse(total, enCours, terminees, refusees);
    }

    // ── Utilitaires ──────────────────────────────────────────────────────────

    private String generateReference() {
        int year = Year.now().getValue();
        long count = demandeRepository.count() + 1;
        return String.format("DEM-%d-%05d", year, count);
    }
}
