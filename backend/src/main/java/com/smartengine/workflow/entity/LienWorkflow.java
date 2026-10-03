package com.smartengine.workflow.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "liens_workflow")
@Getter
@Setter
@NoArgsConstructor
public class LienWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @ManyToOne(optional = false)
    @JoinColumn(name = "noeud_source_id")
    private NoeudWorkflow noeudSource;

    @ManyToOne(optional = false)
    @JoinColumn(name = "noeud_cible_id")
    private NoeudWorkflow noeudCible;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_branche", nullable = false, length = 30)
    private TypeBranche typeBranche = TypeBranche.DEFAULT;
}
