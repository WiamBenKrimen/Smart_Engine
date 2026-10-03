package com.smartengine.workspace.entity;

import com.smartengine.user.entity.Utilisateur;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "membres_espace")
@Getter
@Setter
@NoArgsConstructor
public class MembreEspace {

    @EmbeddedId
    private MembreEspaceId id = new MembreEspaceId();

    @ManyToOne(optional = false)
    @MapsId("espaceId")
    @JoinColumn(name = "espace_id")
    private Espace espace;

    @ManyToOne(optional = false)
    @MapsId("utilisateurId")
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @Column(name = "date_ajout", nullable = false)
    private LocalDateTime dateAjout;

    @PrePersist
    void prePersist() {
        if (dateAjout == null) {
            dateAjout = LocalDateTime.now();
        }
    }
}
