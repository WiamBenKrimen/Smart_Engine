package com.smartengine.workspace.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class MembreEspaceId implements Serializable {

    @Column(name = "espace_id")
    private Long espaceId;

    @Column(name = "utilisateur_id")
    private Long utilisateurId;
}
