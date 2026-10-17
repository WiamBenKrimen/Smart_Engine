package com.smartengine.process.entity;

import com.smartengine.formbuilder.entity.Formulaire;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "processus_brouillons")
@Getter @Setter @NoArgsConstructor
public class ProcessDraft {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150)
    private String ownerEmail;
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String payload;
    @ManyToOne
    @JoinColumn(name = "formulaire_id")
    private Formulaire formulaire;
    @Column(nullable = false)
    private boolean ownsForm = false;
}
