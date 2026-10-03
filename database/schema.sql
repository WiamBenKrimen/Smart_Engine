-- ============================================================
-- SMART ENGINE - BASE DE DONNEES SIMPLE (MySQL 8+)
-- Idee retenue : Workspaces / Espaces metier dynamiques
--
-- Exemple :
-- START -> Manager -> Finance -> Direction -> END
--
-- Si "Finance" n'existe pas encore, l'admin cree un nouvel espace.
-- Ensuite cet espace peut etre reutilise dans tous les workflows.
-- ============================================================

CREATE DATABASE IF NOT EXISTS smart_engine
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE smart_engine;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- SUPPRESSION DES TABLES SI ELLES EXISTENT
-- ============================================================

DROP TABLE IF EXISTS journal_n8n;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS historique;
DROP TABLE IF EXISTS pieces_jointes;
DROP TABLE IF EXISTS taches;
DROP TABLE IF EXISTS instances_workflow;
DROP TABLE IF EXISTS demandes;
DROP TABLE IF EXISTS processus;
DROP TABLE IF EXISTS liens_workflow;
DROP TABLE IF EXISTS noeuds_workflow;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS champs_formulaire;
DROP TABLE IF EXISTS formulaires;
DROP TABLE IF EXISTS membres_espace;
DROP TABLE IF EXISTS espaces;
DROP TABLE IF EXISTS utilisateurs;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. UTILISATEURS
-- ============================================================

CREATE TABLE utilisateurs (
                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                              prenom VARCHAR(100) NOT NULL,
                              nom VARCHAR(100) NOT NULL,
                              email VARCHAR(150) NOT NULL UNIQUE,
                              mot_de_passe VARCHAR(255) NOT NULL,
                              est_admin BOOLEAN NOT NULL DEFAULT FALSE,
                              actif BOOLEAN NOT NULL DEFAULT TRUE,
                              date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. ESPACES METIER
-- Exemples : Manager, RH, Direction, Finance, Juridique...
-- Ils sont dynamiques : on peut en creer de nouveaux.
-- ============================================================

CREATE TABLE espaces (
                         id BIGINT AUTO_INCREMENT PRIMARY KEY,
                         nom VARCHAR(150) NOT NULL,
                         code VARCHAR(80) NOT NULL UNIQUE,
                         description VARCHAR(500),
                         actif BOOLEAN NOT NULL DEFAULT TRUE,
                         date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. MEMBRES D'UN ESPACE
-- Un utilisateur peut appartenir a plusieurs espaces.
-- Un espace peut contenir plusieurs utilisateurs.
-- ============================================================

CREATE TABLE membres_espace (
                                espace_id BIGINT NOT NULL,
                                utilisateur_id BIGINT NOT NULL,
                                date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                PRIMARY KEY (espace_id, utilisateur_id),

                                FOREIGN KEY (espace_id)
                                    REFERENCES espaces(id)
                                    ON DELETE CASCADE,

                                FOREIGN KEY (utilisateur_id)
                                    REFERENCES utilisateurs(id)
                                    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. FORMULAIRES
-- Exemple : Formulaire de remboursement
-- ============================================================

CREATE TABLE formulaires (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                             nom VARCHAR(150) NOT NULL,
                             description VARCHAR(500),
                             actif BOOLEAN NOT NULL DEFAULT TRUE,
                             date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 5. CHAMPS DU FORMULAIRE
-- Exemple : montant, date, justification...
-- ============================================================

CREATE TABLE champs_formulaire (
                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                   formulaire_id BIGINT NOT NULL,

                                   cle_champ VARCHAR(100) NOT NULL,
                                   libelle VARCHAR(150) NOT NULL,

                                   type_champ ENUM(
        'TEXT',
        'TEXTAREA',
        'NUMBER',
        'AMOUNT',
        'DATE',
        'SELECT',
        'CHECKBOX',
        'FILE'
    ) NOT NULL,

                                   obligatoire BOOLEAN NOT NULL DEFAULT FALSE,

    -- Pour SELECT par exemple :
    -- ["Transport", "Repas", "Hotel"]
                                   options_json JSON NULL,

                                   ordre_affichage INT NOT NULL DEFAULT 0,

                                   FOREIGN KEY (formulaire_id)
                                       REFERENCES formulaires(id)
                                       ON DELETE CASCADE,

                                   UNIQUE (formulaire_id, cle_champ)
) ENGINE=InnoDB;

-- ============================================================
-- 6. WORKFLOWS
-- Exemple : Workflow remboursement
-- ============================================================

CREATE TABLE workflows (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           nom VARCHAR(150) NOT NULL,
                           description VARCHAR(500),

                           statut ENUM(
        'BROUILLON',
        'PUBLIE',
        'ARCHIVE'
    ) NOT NULL DEFAULT 'BROUILLON',

                           date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 7. NOEUDS DU WORKFLOW
--
-- START      : debut
-- APPROVAL   : validation humaine
-- CONDITION  : test automatique
-- END        : fin
--
-- espace_id est obligatoire seulement pour APPROVAL.
--
-- Exemple :
-- libelle = "Controle remboursement"
-- type_noeud = APPROVAL
-- espace_id = Finance
-- ============================================================

CREATE TABLE noeuds_workflow (
                                 id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 workflow_id BIGINT NOT NULL,

                                 cle_noeud VARCHAR(100) NOT NULL,
                                 libelle VARCHAR(150) NOT NULL,

                                 type_noeud ENUM(
        'START',
        'APPROVAL',
        'CONDITION',
        'END'
    ) NOT NULL,

                                 espace_id BIGINT NULL,

    -- Pour SLA :
                                 sla_heures INT NULL,

    -- Pour CONDITION :
    -- Exemple :
    -- {
    --   "champ": "montant",
    --   "operateur": ">",
    --   "valeur": 5000
    -- }
                                 configuration_json JSON NULL,

                                 position_x DECIMAL(10,2) DEFAULT 0,
                                 position_y DECIMAL(10,2) DEFAULT 0,

                                 FOREIGN KEY (workflow_id)
                                     REFERENCES workflows(id)
                                     ON DELETE CASCADE,

                                 FOREIGN KEY (espace_id)
                                     REFERENCES espaces(id)
                                     ON DELETE SET NULL,

                                 UNIQUE (workflow_id, cle_noeud)
) ENGINE=InnoDB;

-- ============================================================
-- 8. LIENS ENTRE LES NOEUDS
--
-- DEFAULT   : chemin normal
-- APPROVED  : validation acceptee
-- REJECTED  : validation refusee
-- TRUE      : condition vraie
-- FALSE     : condition fausse
-- ============================================================

CREATE TABLE liens_workflow (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                workflow_id BIGINT NOT NULL,
                                noeud_source_id BIGINT NOT NULL,
                                noeud_cible_id BIGINT NOT NULL,

                                type_branche ENUM(
        'DEFAULT',
        'APPROVED',
        'REJECTED',
        'TRUE',
        'FALSE'
    ) NOT NULL DEFAULT 'DEFAULT',

                                FOREIGN KEY (workflow_id)
                                    REFERENCES workflows(id)
                                    ON DELETE CASCADE,

                                FOREIGN KEY (noeud_source_id)
                                    REFERENCES noeuds_workflow(id)
                                    ON DELETE CASCADE,

                                FOREIGN KEY (noeud_cible_id)
                                    REFERENCES noeuds_workflow(id)
                                    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 9. PROCESSUS
--
-- Un processus = un formulaire + un workflow
--
-- Exemple :
-- Processus : Remboursement
-- Formulaire : Formulaire remboursement
-- Workflow : Workflow remboursement
-- ============================================================

CREATE TABLE processus (
                           id BIGINT AUTO_INCREMENT PRIMARY KEY,
                           nom VARCHAR(150) NOT NULL,
                           description VARCHAR(500),

                           formulaire_id BIGINT NOT NULL,
                           workflow_id BIGINT NOT NULL,

                           statut ENUM(
        'BROUILLON',
        'PUBLIE',
        'ARCHIVE'
    ) NOT NULL DEFAULT 'BROUILLON',

                           date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                           FOREIGN KEY (formulaire_id)
                               REFERENCES formulaires(id),

                           FOREIGN KEY (workflow_id)
                               REFERENCES workflows(id)
) ENGINE=InnoDB;

-- ============================================================
-- 10. DEMANDES
--
-- Une demande est creee par un employe.
--
-- data_json contient les valeurs du formulaire.
-- Exemple :
-- {
--   "montant": 850,
--   "date": "2026-09-30",
--   "justification": "Taxi"
-- }
--
-- Cette solution est simple pour votre projet.
-- ============================================================

CREATE TABLE demandes (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,

                          reference_demande VARCHAR(60) NOT NULL UNIQUE,

                          processus_id BIGINT NOT NULL,
                          cree_par BIGINT NOT NULL,

                          statut ENUM(
        'BROUILLON',
        'EN_COURS',
        'TERMINEE',
        'REFUSEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'BROUILLON',

                          priorite ENUM(
        'BASSE',
        'NORMALE',
        'HAUTE',
        'URGENTE'
    ) NOT NULL DEFAULT 'NORMALE',

                          data_json JSON NOT NULL,

                          date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          date_fin DATETIME NULL,

                          FOREIGN KEY (processus_id)
                              REFERENCES processus(id),

                          FOREIGN KEY (cree_par)
                              REFERENCES utilisateurs(id)
) ENGINE=InnoDB;

-- ============================================================
-- 11. INSTANCE DU WORKFLOW
--
-- C'est l'execution reelle du workflow pour une demande.
-- ============================================================

CREATE TABLE instances_workflow (
                                    id BIGINT AUTO_INCREMENT PRIMARY KEY,

                                    demande_id BIGINT NOT NULL UNIQUE,
                                    workflow_id BIGINT NOT NULL,

                                    noeud_courant_id BIGINT NULL,

                                    statut ENUM(
        'EN_COURS',
        'EN_ATTENTE',
        'TERMINEE',
        'REFUSEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'EN_COURS',

                                    date_debut DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                    date_fin DATETIME NULL,

                                    FOREIGN KEY (demande_id)
                                        REFERENCES demandes(id)
                                        ON DELETE CASCADE,

                                    FOREIGN KEY (workflow_id)
                                        REFERENCES workflows(id),

                                    FOREIGN KEY (noeud_courant_id)
                                        REFERENCES noeuds_workflow(id)
                                        ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 12. TACHES
--
-- Quand le moteur arrive sur un noeud APPROVAL,
-- il cree une tache dans l'espace responsable.
--
-- Exemple :
-- espace = Finance
-- attribue_a = NULL
-- statut = EN_ATTENTE
--
-- Puis Nadia prend la tache :
-- attribue_a = Nadia
-- statut = EN_COURS
-- ============================================================

CREATE TABLE taches (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,

                        instance_id BIGINT NOT NULL,
                        noeud_id BIGINT NOT NULL,
                        espace_id BIGINT NOT NULL,

                        attribue_a BIGINT NULL,

                        statut ENUM(
        'EN_ATTENTE',
        'EN_COURS',
        'APPROUVEE',
        'REFUSEE',
        'ANNULEE'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

                        date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        date_prise_en_charge DATETIME NULL,
                        date_limite DATETIME NULL,
                        date_fin DATETIME NULL,

                        FOREIGN KEY (instance_id)
                            REFERENCES instances_workflow(id)
                            ON DELETE CASCADE,

                        FOREIGN KEY (noeud_id)
                            REFERENCES noeuds_workflow(id),

                        FOREIGN KEY (espace_id)
                            REFERENCES espaces(id),

                        FOREIGN KEY (attribue_a)
                            REFERENCES utilisateurs(id)
                            ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 13. PIECES JOINTES
-- ============================================================

CREATE TABLE pieces_jointes (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,

                                demande_id BIGINT NOT NULL,
                                ajoute_par BIGINT NOT NULL,

                                nom_original VARCHAR(255) NOT NULL,
                                chemin_fichier VARCHAR(500) NOT NULL,
                                type_fichier VARCHAR(150),

                                date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                FOREIGN KEY (demande_id)
                                    REFERENCES demandes(id)
                                    ON DELETE CASCADE,

                                FOREIGN KEY (ajoute_par)
                                    REFERENCES utilisateurs(id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. HISTORIQUE / AUDIT
--
-- Exemple :
-- DEMANDE_CREEE
-- WORKFLOW_DEMARRE
-- TACHE_CREEE
-- TACHE_PRISE
-- TACHE_APPROUVEE
-- TACHE_REFUSEE
-- SLA_DEPASSE
-- WORKFLOW_TERMINE
-- ============================================================

CREATE TABLE historique (
                            id BIGINT AUTO_INCREMENT PRIMARY KEY,

                            demande_id BIGINT NOT NULL,
                            utilisateur_id BIGINT NULL,
                            espace_id BIGINT NULL,
                            tache_id BIGINT NULL,

                            action VARCHAR(100) NOT NULL,
                            details TEXT NULL,

                            date_action DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            FOREIGN KEY (demande_id)
                                REFERENCES demandes(id)
                                ON DELETE CASCADE,

                            FOREIGN KEY (utilisateur_id)
                                REFERENCES utilisateurs(id)
                                ON DELETE SET NULL,

                            FOREIGN KEY (espace_id)
                                REFERENCES espaces(id)
                                ON DELETE SET NULL,

                            FOREIGN KEY (tache_id)
                                REFERENCES taches(id)
                                ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
                               id BIGINT AUTO_INCREMENT PRIMARY KEY,

                               utilisateur_id BIGINT NOT NULL,
                               demande_id BIGINT NULL,
                               tache_id BIGINT NULL,

                               titre VARCHAR(200) NOT NULL,
                               message VARCHAR(1000) NOT NULL,

                               lu BOOLEAN NOT NULL DEFAULT FALSE,

                               date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               FOREIGN KEY (utilisateur_id)
                                   REFERENCES utilisateurs(id)
                                   ON DELETE CASCADE,

                               FOREIGN KEY (demande_id)
                                   REFERENCES demandes(id)
                                   ON DELETE CASCADE,

                               FOREIGN KEY (tache_id)
                                   REFERENCES taches(id)
                                   ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 16. JOURNAL N8N
--
-- n8n est utilise seulement pour email / notification externe.
-- Spring Boot reste le moteur principal.
-- ============================================================

CREATE TABLE journal_n8n (
                             id BIGINT AUTO_INCREMENT PRIMARY KEY,

                             demande_id BIGINT NULL,

                             evenement VARCHAR(100) NOT NULL,

                             payload_json JSON NULL,

                             statut ENUM(
        'EN_ATTENTE',
        'ENVOYE',
        'ECHEC'
    ) NOT NULL DEFAULT 'EN_ATTENTE',

                             date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                             FOREIGN KEY (demande_id)
                                 REFERENCES demandes(id)
                                 ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- INDEX SIMPLES ET UTILES
-- ============================================================

CREATE INDEX idx_taches_espace_statut
    ON taches(espace_id, statut);

CREATE INDEX idx_taches_utilisateur
    ON taches(attribue_a, statut);

CREATE INDEX idx_taches_date_limite
    ON taches(date_limite);

CREATE INDEX idx_demandes_utilisateur
    ON demandes(cree_par, statut);

CREATE INDEX idx_demandes_processus
    ON demandes(processus_id, statut);

CREATE INDEX idx_historique_demande
    ON historique(demande_id, date_action);

CREATE INDEX idx_notifications_utilisateur
    ON notifications(utilisateur_id, lu);

-- ============================================================
-- ESPACES DE DEPART
--
-- Finance n'est pas cree ici volontairement.
-- Il pourra etre cree dynamiquement par l'admin
-- depuis le Workflow Designer.
-- ============================================================

INSERT INTO espaces (nom, code, description)
VALUES
    ('Manager', 'MANAGER', 'Espace des managers'),
    ('Ressources Humaines', 'RH', 'Espace RH'),
    ('Direction', 'DIRECTION', 'Espace de la direction');

-- ============================================================
-- FIN
-- ============================================================
CREATE DATABASE IF NOT EXISTS smart_engine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_engine;

CREATE TABLE IF NOT EXISTS utilisateurs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role_systeme VARCHAR(40) NOT NULL DEFAULT 'USER',
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS espaces (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(120) NOT NULL,
    code VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(500),
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS membres_espace (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    espace_id BIGINT NOT NULL,
    utilisateur_id BIGINT NOT NULL,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_membres_espace_espace FOREIGN KEY (espace_id) REFERENCES espaces(id),
    CONSTRAINT fk_membres_espace_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id),
    CONSTRAINT uk_membres_espace UNIQUE (espace_id, utilisateur_id)
);

CREATE TABLE IF NOT EXISTS formulaires (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    statut VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS champs_formulaire (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    formulaire_id BIGINT NOT NULL,
    cle_technique VARCHAR(120) NOT NULL,
    libelle VARCHAR(160) NOT NULL,
    type_champ VARCHAR(40) NOT NULL,
    obligatoire BOOLEAN NOT NULL DEFAULT FALSE,
    placeholder VARCHAR(255),
    aide VARCHAR(500),
    options_json JSON,
    ordre_affichage INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_champs_formulaire_formulaire FOREIGN KEY (formulaire_id) REFERENCES formulaires(id),
    CONSTRAINT uk_champs_formulaire_cle UNIQUE (formulaire_id, cle_technique)
);

CREATE TABLE IF NOT EXISTS workflows (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    statut VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS noeuds_workflow (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_id BIGINT NOT NULL,
    libelle VARCHAR(160) NOT NULL,
    type_noeud VARCHAR(40) NOT NULL,
    espace_id BIGINT,
    configuration_json JSON,
    position_x DOUBLE NOT NULL DEFAULT 0,
    position_y DOUBLE NOT NULL DEFAULT 0,
    CONSTRAINT fk_noeuds_workflow_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    CONSTRAINT fk_noeuds_workflow_espace FOREIGN KEY (espace_id) REFERENCES espaces(id)
);

CREATE TABLE IF NOT EXISTS liens_workflow (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    workflow_id BIGINT NOT NULL,
    source_noeud_id BIGINT NOT NULL,
    cible_noeud_id BIGINT NOT NULL,
    branche VARCHAR(40) NOT NULL DEFAULT 'DEFAULT',
    CONSTRAINT fk_liens_workflow_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    CONSTRAINT fk_liens_workflow_source FOREIGN KEY (source_noeud_id) REFERENCES noeuds_workflow(id),
    CONSTRAINT fk_liens_workflow_cible FOREIGN KEY (cible_noeud_id) REFERENCES noeuds_workflow(id)
);

CREATE TABLE IF NOT EXISTS processus (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(160) NOT NULL,
    description VARCHAR(500),
    formulaire_id BIGINT NOT NULL,
    workflow_id BIGINT NOT NULL,
    statut VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_processus_formulaire FOREIGN KEY (formulaire_id) REFERENCES formulaires(id),
    CONSTRAINT fk_processus_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

CREATE TABLE IF NOT EXISTS demandes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(80) NOT NULL UNIQUE,
    processus_id BIGINT NOT NULL,
    demandeur_id BIGINT NOT NULL,
    data_json JSON NOT NULL,
    priorite VARCHAR(40),
    statut VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED',
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_demandes_processus FOREIGN KEY (processus_id) REFERENCES processus(id),
    CONSTRAINT fk_demandes_demandeur FOREIGN KEY (demandeur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS instances_workflow (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    demande_id BIGINT NOT NULL UNIQUE,
    workflow_id BIGINT NOT NULL,
    noeud_courant_id BIGINT,
    statut VARCHAR(40) NOT NULL DEFAULT 'RUNNING',
    date_debut TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_fin TIMESTAMP NULL,
    CONSTRAINT fk_instances_workflow_demande FOREIGN KEY (demande_id) REFERENCES demandes(id),
    CONSTRAINT fk_instances_workflow_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    CONSTRAINT fk_instances_workflow_noeud FOREIGN KEY (noeud_courant_id) REFERENCES noeuds_workflow(id)
);

CREATE TABLE IF NOT EXISTS taches (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    instance_id BIGINT NOT NULL,
    noeud_id BIGINT NOT NULL,
    espace_id BIGINT NOT NULL,
    attribue_a BIGINT,
    statut VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    commentaire TEXT,
    date_limite TIMESTAMP NULL,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    terminee_le TIMESTAMP NULL,
    CONSTRAINT fk_taches_instance FOREIGN KEY (instance_id) REFERENCES instances_workflow(id),
    CONSTRAINT fk_taches_noeud FOREIGN KEY (noeud_id) REFERENCES noeuds_workflow(id),
    CONSTRAINT fk_taches_espace FOREIGN KEY (espace_id) REFERENCES espaces(id),
    CONSTRAINT fk_taches_attribue FOREIGN KEY (attribue_a) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS pieces_jointes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    demande_id BIGINT NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    chemin_stockage VARCHAR(500) NOT NULL,
    type_mime VARCHAR(120),
    taille_octets BIGINT,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pieces_jointes_demande FOREIGN KEY (demande_id) REFERENCES demandes(id)
);

CREATE TABLE IF NOT EXISTS historique (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    demande_id BIGINT,
    utilisateur_id BIGINT,
    type_evenement VARCHAR(80) NOT NULL,
    message VARCHAR(1000),
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historique_demande FOREIGN KEY (demande_id) REFERENCES demandes(id),
    CONSTRAINT fk_historique_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id BIGINT NOT NULL,
    titre VARCHAR(160) NOT NULL,
    message VARCHAR(1000),
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_utilisateur FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

CREATE TABLE IF NOT EXISTS journal_n8n (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type_evenement VARCHAR(80) NOT NULL,
    payload_json JSON,
    statut VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    erreur TEXT,
    cree_le TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
