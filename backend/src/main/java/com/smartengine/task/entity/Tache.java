package com.smartengine.task.entity;

import com.smartengine.user.entity.Utilisateur;
import com.smartengine.workflow.entity.NoeudWorkflow;
import com.smartengine.workflowinstance.entity.InstanceWorkflow;
import com.smartengine.workspace.entity.Espace;
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
@Table(name = "taches")
@Getter
@Setter
@NoArgsConstructor
public class Tache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "instance_id")
    private InstanceWorkflow instance;

    @ManyToOne(optional = false)
    @JoinColumn(name = "noeud_id")
    private NoeudWorkflow noeud;

    @ManyToOne(optional = false)
    @JoinColumn(name = "espace_id")
    private Espace espace;

    @ManyToOne
    @JoinColumn(name = "attribue_a")
    private Utilisateur attribueA;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutTache statut = StatutTache.EN_ATTENTE;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_prise_en_charge")
    private LocalDateTime datePriseEnCharge;

    @Column(name = "date_limite")
    private LocalDateTime dateLimite;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @PrePersist
    void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}
