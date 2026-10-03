package com.smartengine.workflowinstance.entity;

import com.smartengine.request.entity.Demande;
import com.smartengine.workflow.entity.NoeudWorkflow;
import com.smartengine.workflow.entity.Workflow;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "instances_workflow")
@Getter
@Setter
@NoArgsConstructor
public class InstanceWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "demande_id", unique = true)
    private Demande demande;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @ManyToOne
    @JoinColumn(name = "noeud_courant_id")
    private NoeudWorkflow noeudCourant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private StatutInstanceWorkflow statut = StatutInstanceWorkflow.EN_COURS;

    @Column(name = "date_debut", nullable = false)
    private LocalDateTime dateDebut;

    @Column(name = "date_fin")
    private LocalDateTime dateFin;

    @PrePersist
    void prePersist() {
        if (dateDebut == null) {
            dateDebut = LocalDateTime.now();
        }
    }
}
