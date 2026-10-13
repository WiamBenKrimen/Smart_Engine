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
-- FIN
-- ============================================================
