package com.smartengine.audit.entity;

import com.smartengine.request.entity.Demande;
import com.smartengine.task.entity.Tache;
import com.smartengine.user.entity.Utilisateur;
import com.smartengine.workspace.entity.Espace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "historique")
@Getter
@Setter
@NoArgsConstructor
public class Historique {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "demande_id")
    private Demande demande;

    @ManyToOne
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @ManyToOne
    @JoinColumn(name = "espace_id")
    private Espace espace;

    @ManyToOne
    @JoinColumn(name = "tache_id")
    private Tache tache;

    @Column(nullable = false, length = 100)
    private String action;

    @Lob
    private String details;

    @Column(name = "date_action", nullable = false)
    private LocalDateTime dateAction;

    @PrePersist
    void prePersist() {
        if (dateAction == null) {
            dateAction = LocalDateTime.now();
        }
    }
}
