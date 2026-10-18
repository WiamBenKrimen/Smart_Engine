package com.smartengine.process.entity;

import com.smartengine.formbuilder.entity.Formulaire;
import com.smartengine.workflow.entity.Workflow;
import com.smartengine.workflow.entity.WorkflowStatut;
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
@Table(name = "processus")
@Getter
@Setter
@NoArgsConstructor
public class Processus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nom;

    @Column(length = 500)
    private String description;

    @ManyToOne(optional = false)
    @JoinColumn(name = "formulaire_id")
    private Formulaire formulaire;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private WorkflowStatut statut = WorkflowStatut.BROUILLON;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation;

    @Column(length = 30)
    private String icon = "📋";

    @Column(name = "workspaces_json", columnDefinition = "json")
    private String workspacesJson;

    @PrePersist
    void prePersist() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Formulaire getFormulaire() { return formulaire; }
    public void setFormulaire(Formulaire formulaire) { this.formulaire = formulaire; }
    public Workflow getWorkflow() { return workflow; }
    public void setWorkflow(Workflow workflow) { this.workflow = workflow; }
    public WorkflowStatut getStatut() { return statut; }
    public void setStatut(WorkflowStatut statut) { this.statut = statut; }
    public LocalDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(LocalDateTime dateCreation) { this.dateCreation = dateCreation; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getWorkspacesJson() { return workspacesJson; }
    public void setWorkspacesJson(String workspacesJson) { this.workspacesJson = workspacesJson; }
}
