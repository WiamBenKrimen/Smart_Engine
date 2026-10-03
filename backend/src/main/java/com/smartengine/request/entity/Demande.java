package com.smartengine.request.entity;

import com.smartengine.process.entity.Processus;
import com.smartengine.user.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "demandes")
@Getter
@Setter
@NoArgsConstructor
public class Demande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reference_demande", nullable = false, unique = true, length = 60)
    private String referenceDemande;

    @ManyToOne(optional = false)
    @JoinColumn(name = "processus_id")
    private Processus processus;

    @ManyToOne(optional = false)
    @JoinColumn(name = "cree_par")
    private Utilisateur creePar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutDemande statut = StatutDemande.BROUILLON;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PrioriteDemande priorite = PrioriteDemande.NORMALE;

    @Column(name = "data_json", nullable = false, columnDefinition = "json")
    private String dataJson;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @PrePersist
    void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
