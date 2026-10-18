package com.smartengine.workflow.entity;

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
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "noeuds_workflow",
    uniqueConstraints = @UniqueConstraint(columnNames = {"workflow_id", "cle_noeud"})
)
@Getter
@Setter
@NoArgsConstructor
public class NoeudWorkflow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @Column(name = "cle_noeud", nullable = false, length = 100)
    private String cleNoeud;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_noeud", nullable = false, length = 30)
    private TypeNoeud typeNoeud;

    @ManyToOne
    @JoinColumn(name = "espace_id")
    private Espace espace;

    @Column(name = "sla_heures")
    private Integer slaHeures;

    @Column(name = "configuration_json", columnDefinition = "json")
    private String configurationJson;

    @Column(name = "position_x", precision = 10, scale = 2)
    private BigDecimal positionX = BigDecimal.ZERO;

    @Column(name = "position_y", precision = 10, scale = 2)
    private BigDecimal positionY = BigDecimal.ZERO;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Workflow getWorkflow() { return workflow; }
    public void setWorkflow(Workflow workflow) { this.workflow = workflow; }
    public String getCleNoeud() { return cleNoeud; }
    public void setCleNoeud(String cleNoeud) { this.cleNoeud = cleNoeud; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    public TypeNoeud getTypeNoeud() { return typeNoeud; }
    public void setTypeNoeud(TypeNoeud typeNoeud) { this.typeNoeud = typeNoeud; }
    public Espace getEspace() { return espace; }
    public void setEspace(Espace espace) { this.espace = espace; }
    public Integer getSlaHeures() { return slaHeures; }
    public void setSlaHeures(Integer slaHeures) { this.slaHeures = slaHeures; }
    public String getConfigurationJson() { return configurationJson; }
    public void setConfigurationJson(String configurationJson) { this.configurationJson = configurationJson; }
    public BigDecimal getPositionX() { return positionX; }
    public void setPositionX(BigDecimal positionX) { this.positionX = positionX; }
    public BigDecimal getPositionY() { return positionY; }
    public void setPositionY(BigDecimal positionY) { this.positionY = positionY; }
}
