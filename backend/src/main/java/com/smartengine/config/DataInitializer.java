package com.smartengine.config;

import com.smartengine.user.entity.Utilisateur;
import com.smartengine.user.repository.UtilisateurRepository;
import com.smartengine.workspace.entity.Espace;
import com.smartengine.workspace.entity.MembreEspace;
import com.smartengine.workspace.entity.MembreEspaceId;
import com.smartengine.workspace.repository.EspaceRepository;
import com.smartengine.workspace.repository.MembreEspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UtilisateurRepository utilisateurRepository;
    private final EspaceRepository espaceRepository;
    private final MembreEspaceRepository membreEspaceRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner seedDefaultData() {
        return args -> {
            if (utilisateurRepository.count() > 0) {
                return;
            }

            Utilisateur admin = createUser("Admin", "Smart Engine", "admin@smartengine.com", "Admin123!", true);
            Utilisateur mohamed = createUser("Mohamed", "Alaoui", "mohamed@smartengine.com", "User123!", false);
            Utilisateur sara = createUser("Sara", "El Mansouri", "sara@smartengine.com", "User123!", false);

            Espace finance = createEspace("Finance", "FINANCE", "Espace Finance");
            Espace rh = createEspace("Ressources Humaines", "RH", "Espace RH");
            Espace direction = createEspace("Direction", "DIRECTION", "Espace de la direction");

            addMember(finance, mohamed);
            addMember(rh, mohamed);
            addMember(direction, sara);
        };
    }

    private Utilisateur createUser(String prenom, String nom, String email, String password, boolean admin) {
        Utilisateur user = new Utilisateur();
        user.setPrenom(prenom);
        user.setNom(nom);
        user.setEmail(email);
        user.setMotDePasse(passwordEncoder.encode(password));
        user.setEstAdmin(admin);
        user.setActif(true);
        return utilisateurRepository.save(user);
    }

    private Espace createEspace(String nom, String code, String description) {
        Espace espace = new Espace();
        espace.setNom(nom);
        espace.setCode(code);
        espace.setDescription(description);
        espace.setActif(true);
        return espaceRepository.save(espace);
    }

    private void addMember(Espace espace, Utilisateur utilisateur) {
        MembreEspace membre = new MembreEspace();
        MembreEspaceId id = new MembreEspaceId();
        id.setEspaceId(espace.getId());
        id.setUtilisateurId(utilisateur.getId());
        membre.setId(id);
        membre.setEspace(espace);
        membre.setUtilisateur(utilisateur);
        membreEspaceRepository.save(membre);
    }
}
