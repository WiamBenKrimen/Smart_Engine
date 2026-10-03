package com.smartengine.formbuilder.entity;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "champs_formulaire",
    uniqueConstraints = @UniqueConstraint(columnNames = {"formulaire_id", "cle_champ"})
)
@Getter
@Setter
@NoArgsConstructor
public class ChampFormulaire {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "formulaire_id")
    private Formulaire formulaire;

    @Column(name = "cle_champ", nullable = false, length = 100)
    private String cleChamp;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_champ", nullable = false, length = 30)
    private TypeChamp typeChamp;

    @Column(nullable = false)
    private Boolean obligatoire = false;

    @Column(name = "options_json", columnDefinition = "json")
    private String optionsJson;

    @Column(name = "ordre_affichage", nullable = false)
    private Integer ordreAffichage = 0;
}
