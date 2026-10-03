-- ============================================================
-- SMART ENGINE - seed.sql
-- MySQL 8+
-- Donnees de demonstration DEV / TEST
--
-- IMPORTANT :
-- 1) Executer d'abord schema.sql
-- 2) Ensuite executer ce fichier seed.sql
-- 3) Ne pas utiliser ce fichier en production
--
-- Cette version utilise DELETE au lieu de TRUNCATE pour eviter
-- les erreurs de cles etrangeres dans phpMyAdmin.
-- ============================================================

USE smart_engine;

-- ============================================================
-- 0. NETTOYAGE DES DONNEES EXISTANTES
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM journal_n8n;
DELETE FROM notifications;
DELETE FROM historique;
DELETE FROM pieces_jointes;
DELETE FROM taches;
DELETE FROM instances_workflow;
DELETE FROM demandes;
DELETE FROM processus;
DELETE FROM liens_workflow;
DELETE FROM noeuds_workflow;
DELETE FROM workflows;
DELETE FROM champs_formulaire;
DELETE FROM formulaires;
DELETE FROM membres_espace;
DELETE FROM espaces;
DELETE FROM utilisateurs;

-- Remise a zero des AUTO_INCREMENT
ALTER TABLE utilisateurs AUTO_INCREMENT = 1;
ALTER TABLE espaces AUTO_INCREMENT = 1;
ALTER TABLE formulaires AUTO_INCREMENT = 1;
ALTER TABLE champs_formulaire AUTO_INCREMENT = 1;
ALTER TABLE workflows AUTO_INCREMENT = 1;
ALTER TABLE noeuds_workflow AUTO_INCREMENT = 1;
ALTER TABLE liens_workflow AUTO_INCREMENT = 1;
ALTER TABLE processus AUTO_INCREMENT = 1;
ALTER TABLE demandes AUTO_INCREMENT = 1;
ALTER TABLE instances_workflow AUTO_INCREMENT = 1;
ALTER TABLE taches AUTO_INCREMENT = 1;
ALTER TABLE pieces_jointes AUTO_INCREMENT = 1;
ALTER TABLE historique AUTO_INCREMENT = 1;
ALTER TABLE notifications AUTO_INCREMENT = 1;
ALTER TABLE journal_n8n AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 1. UTILISATEURS
--
-- Comptes de demo :
-- admin@smartengine.com   / Admin123!
-- tous les autres        / User123!
--
-- Les mots de passe sont deja hashes avec BCrypt.
-- ============================================================

INSERT INTO utilisateurs
(id, prenom, nom, email, mot_de_passe, est_admin, actif)
VALUES
    (1, 'Admin', 'Smart Engine', 'admin@smartengine.com',
     '$2y$10$SFYWWUMiXHznLDWoOe83juyn9V/incNaV3qw0JoGkXq3K0RfRbN9m',
     TRUE, TRUE),

    (2, 'Mohamed', 'Alaoui', 'mohamed@smartengine.com',
     '$2y$10$qold7nlV3WA41SSPHfrZB.PKRtcoNEpSYZuVApsaxXGMn7cVoXXI.',
     FALSE, TRUE),

    (3, 'Sara', 'El Mansouri', 'sara@smartengine.com',
     '$2y$10$qold7nlV3WA41SSPHfrZB.PKRtcoNEpSYZuVApsaxXGMn7cVoXXI.',
     FALSE, TRUE),

    (4, 'Nadia', 'Benali', 'nadia@smartengine.com',
     '$2y$10$qold7nlV3WA41SSPHfrZB.PKRtcoNEpSYZuVApsaxXGMn7cVoXXI.',
     FALSE, TRUE),

    (5, 'Ahmed', 'Idrissi', 'ahmed@smartengine.com',
     '$2y$10$qold7nlV3WA41SSPHfrZB.PKRtcoNEpSYZuVApsaxXGMn7cVoXXI.',
     FALSE, TRUE),

    (6, 'Youssef', 'Amrani', 'youssef@smartengine.com',
     '$2y$10$qold7nlV3WA41SSPHfrZB.PKRtcoNEpSYZuVApsaxXGMn7cVoXXI.',
     FALSE, TRUE);

-- ============================================================
-- 2. ESPACES / WORKSPACES
--
-- Finance est ajoute ici uniquement pour la demo.
-- Dans l'application, il pourra etre cree dynamiquement.
-- ============================================================

INSERT INTO espaces
(id, nom, code, description, actif)
VALUES
    (1, 'Manager', 'MANAGER', 'Espace des managers', TRUE),
    (2, 'Ressources Humaines', 'RH', 'Espace RH', TRUE),
    (3, 'Direction', 'DIRECTION', 'Espace de la direction', TRUE),
    (4, 'Finance', 'FINANCE', 'Espace du service financier', TRUE);

-- ============================================================
-- 3. MEMBRES DES ESPACES
-- ============================================================

INSERT INTO membres_espace (espace_id, utilisateur_id)
VALUES
    (1, 3), -- Sara -> Manager
    (1, 5), -- Ahmed -> Manager
    (2, 6), -- Youssef -> RH
    (3, 5), -- Ahmed -> Direction
    (4, 4); -- Nadia -> Finance

-- ============================================================
-- 4. FORMULAIRES
-- ============================================================

INSERT INTO formulaires
(id, nom, description, actif)
VALUES
    (1, 'Demande de remboursement',
     'Formulaire de remboursement des depenses.', TRUE),

    (2, 'Demande de conge',
     'Formulaire de demande de conge.', TRUE),

    (3, 'Demande de recrutement',
     'Formulaire interne de demande de recrutement.', TRUE);

-- ============================================================
-- 5. CHAMPS DES FORMULAIRES
-- ============================================================

-- ------------------------------------------------------------
-- Remboursement
-- ------------------------------------------------------------

INSERT INTO champs_formulaire
(id, formulaire_id, cle_champ, libelle, type_champ,
 obligatoire, options_json, ordre_affichage)
VALUES
    (1, 1, 'montant', 'Montant', 'AMOUNT',
     TRUE, NULL, 1),

    (2, 1, 'date_depense', 'Date de la depense', 'DATE',
     TRUE, NULL, 2),

    (3, 1, 'type_depense', 'Type de depense', 'SELECT',
     TRUE,
     JSON_ARRAY('Transport', 'Repas', 'Hotel', 'Materiel', 'Autre'),
     3),

    (4, 1, 'justification', 'Justification', 'TEXTAREA',
     TRUE, NULL, 4),

    (5, 1, 'piece_jointe', 'Justificatif', 'FILE',
     FALSE, NULL, 5);

-- ------------------------------------------------------------
-- Conge
-- ------------------------------------------------------------

INSERT INTO champs_formulaire
(id, formulaire_id, cle_champ, libelle, type_champ,
 obligatoire, options_json, ordre_affichage)
VALUES
    (6, 2, 'date_debut', 'Date de debut', 'DATE',
     TRUE, NULL, 1),

    (7, 2, 'date_fin', 'Date de fin', 'DATE',
     TRUE, NULL, 2),

    (8, 2, 'nombre_jours', 'Nombre de jours', 'NUMBER',
     TRUE, NULL, 3),

    (9, 2, 'type_conge', 'Type de conge', 'SELECT',
     TRUE,
     JSON_ARRAY('Annuel', 'Exceptionnel', 'Sans solde'),
     4),

    (10, 2, 'motif', 'Motif', 'TEXTAREA',
     FALSE, NULL, 5);

-- ------------------------------------------------------------
-- Recrutement
-- ------------------------------------------------------------

INSERT INTO champs_formulaire
(id, formulaire_id, cle_champ, libelle, type_champ,
 obligatoire, options_json, ordre_affichage)
VALUES
    (11, 3, 'poste', 'Intitule du poste', 'TEXT',
     TRUE, NULL, 1),

    (12, 3, 'departement', 'Departement', 'TEXT',
     TRUE, NULL, 2),

    (13, 3, 'nombre_postes', 'Nombre de postes', 'NUMBER',
     TRUE, NULL, 3),

    (14, 3, 'type_contrat', 'Type de contrat', 'SELECT',
     TRUE,
     JSON_ARRAY('CDI', 'CDD', 'Stage'),
     4),

    (15, 3, 'budget_mensuel', 'Budget mensuel prevu', 'AMOUNT',
     TRUE, NULL, 5),

    (16, 3, 'justification', 'Justification du besoin', 'TEXTAREA',
     TRUE, NULL, 6);

-- ============================================================
-- 6. WORKFLOWS
-- ============================================================

INSERT INTO workflows
(id, nom, description, statut)
VALUES
    (1, 'Workflow remboursement',
     'Validation d un remboursement selon le montant.',
     'PUBLIE'),

    (2, 'Workflow conge',
     'Validation d une demande de conge.',
     'PUBLIE'),

    (3, 'Workflow recrutement',
     'Validation interne d une demande de recrutement.',
     'PUBLIE');

-- ============================================================
-- 7. NOEUDS - WORKFLOW REMBOURSEMENT
-- ============================================================

INSERT INTO noeuds_workflow
(id, workflow_id, cle_noeud, libelle, type_noeud,
 espace_id, sla_heures, configuration_json, position_x, position_y)
VALUES
    (1, 1, 'start',
     'Debut',
     'START',
     NULL, NULL, NULL,
     300, 50),

    (2, 1, 'validation_manager',
     'Validation Manager',
     'APPROVAL',
     1, 24, NULL,
     300, 170),

    (3, 1, 'condition_montant',
     'Montant superieur a 5000 DH ?',
     'CONDITION',
     NULL, NULL,
     JSON_OBJECT(
             'champ', 'montant',
             'operateur', '>',
             'valeur', 5000
     ),
     300, 300),

    (4, 1, 'validation_finance',
     'Validation Finance',
     'APPROVAL',
     4, 24, NULL,
     180, 440),

    (5, 1, 'fin_terminee_finance',
     'Fin - Terminee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'TERMINEE'),
     180, 580),

    (6, 1, 'fin_terminee_directe',
     'Fin - Terminee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'TERMINEE'),
     440, 440),

    (7, 1, 'fin_refusee',
     'Fin - Refusee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'REFUSEE'),
     560, 220);

-- ============================================================
-- 8. LIENS - WORKFLOW REMBOURSEMENT
-- ============================================================

INSERT INTO liens_workflow
(id, workflow_id, noeud_source_id, noeud_cible_id, type_branche)
VALUES
    (1, 1, 1, 2, 'DEFAULT'),
    (2, 1, 2, 3, 'APPROVED'),
    (3, 1, 2, 7, 'REJECTED'),
    (4, 1, 3, 4, 'TRUE'),
    (5, 1, 3, 6, 'FALSE'),
    (6, 1, 4, 5, 'APPROVED'),
    (7, 1, 4, 7, 'REJECTED');

-- ============================================================
-- 9. NOEUDS - WORKFLOW CONGE
-- ============================================================

INSERT INTO noeuds_workflow
(id, workflow_id, cle_noeud, libelle, type_noeud,
 espace_id, sla_heures, configuration_json, position_x, position_y)
VALUES
    (8, 2, 'start',
     'Debut',
     'START',
     NULL, NULL, NULL,
     300, 50),

    (9, 2, 'validation_manager',
     'Validation Manager',
     'APPROVAL',
     1, 24, NULL,
     300, 160),

    (10, 2, 'condition_jours',
     'Nombre de jours superieur a 5 ?',
     'CONDITION',
     NULL, NULL,
     JSON_OBJECT(
             'champ', 'nombre_jours',
             'operateur', '>',
             'valeur', 5
     ),
     300, 290),

    (11, 2, 'validation_direction',
     'Validation Direction',
     'APPROVAL',
     3, 24, NULL,
     170, 420),

    (12, 2, 'validation_rh_long',
     'Validation RH',
     'APPROVAL',
     2, 24, NULL,
     170, 540),

    (13, 2, 'validation_rh_court',
     'Validation RH',
     'APPROVAL',
     2, 24, NULL,
     430, 420),

    (14, 2, 'fin_terminee',
     'Fin - Terminee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'TERMINEE'),
     300, 680),

    (15, 2, 'fin_refusee',
     'Fin - Refusee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'REFUSEE'),
     590, 300);

-- ============================================================
-- 10. LIENS - WORKFLOW CONGE
-- ============================================================

INSERT INTO liens_workflow
(id, workflow_id, noeud_source_id, noeud_cible_id, type_branche)
VALUES
    (8, 2, 8, 9, 'DEFAULT'),
    (9, 2, 9, 10, 'APPROVED'),
    (10, 2, 9, 15, 'REJECTED'),

    (11, 2, 10, 11, 'TRUE'),
    (12, 2, 10, 13, 'FALSE'),

    (13, 2, 11, 12, 'APPROVED'),
    (14, 2, 11, 15, 'REJECTED'),

    (15, 2, 12, 14, 'APPROVED'),
    (16, 2, 12, 15, 'REJECTED'),

    (17, 2, 13, 14, 'APPROVED'),
    (18, 2, 13, 15, 'REJECTED');

-- ============================================================
-- 11. NOEUDS - WORKFLOW RECRUTEMENT
-- ============================================================

INSERT INTO noeuds_workflow
(id, workflow_id, cle_noeud, libelle, type_noeud,
 espace_id, sla_heures, configuration_json, position_x, position_y)
VALUES
    (16, 3, 'start',
     'Debut',
     'START',
     NULL, NULL, NULL,
     300, 50),

    (17, 3, 'analyse_rh',
     'Analyse de la demande',
     'APPROVAL',
     2, 24, NULL,
     300, 160),

    (18, 3, 'validation_budget',
     'Validation du budget',
     'APPROVAL',
     4, 24, NULL,
     300, 280),

    (19, 3, 'validation_direction',
     'Validation du recrutement',
     'APPROVAL',
     3, 24, NULL,
     300, 400),

    (20, 3, 'validation_finale_rh',
     'Validation finale RH',
     'APPROVAL',
     2, 24, NULL,
     300, 520),

    (21, 3, 'fin_terminee',
     'Fin - Terminee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'TERMINEE'),
     300, 650),

    (22, 3, 'fin_refusee',
     'Fin - Refusee',
     'END',
     NULL, NULL,
     JSON_OBJECT('resultat', 'REFUSEE'),
     550, 400);

-- ============================================================
-- 12. LIENS - WORKFLOW RECRUTEMENT
-- ============================================================

INSERT INTO liens_workflow
(id, workflow_id, noeud_source_id, noeud_cible_id, type_branche)
VALUES
    (19, 3, 16, 17, 'DEFAULT'),

    (20, 3, 17, 18, 'APPROVED'),
    (21, 3, 17, 22, 'REJECTED'),

    (22, 3, 18, 19, 'APPROVED'),
    (23, 3, 18, 22, 'REJECTED'),

    (24, 3, 19, 20, 'APPROVED'),
    (25, 3, 19, 22, 'REJECTED'),

    (26, 3, 20, 21, 'APPROVED'),
    (27, 3, 20, 22, 'REJECTED');

-- ============================================================
-- 13. PROCESSUS = FORMULAIRE + WORKFLOW
-- ============================================================

INSERT INTO processus
(id, nom, description, formulaire_id, workflow_id, statut)
VALUES
    (1, 'Demande de remboursement',
     'Processus de remboursement.',
     1, 1, 'PUBLIE'),

    (2, 'Demande de conge',
     'Processus de demande de conge.',
     2, 2, 'PUBLIE'),

    (3, 'Demande de recrutement',
     'Processus de demande de recrutement.',
     3, 3, 'PUBLIE');

-- ============================================================
-- 14. DEMANDES DE DEMO
-- ============================================================

INSERT INTO demandes
(id, reference_demande, processus_id, cree_par, statut, priorite,
 data_json, date_creation, date_fin)
VALUES
    (1, 'REQ-2026-0001', 1, 2, 'EN_COURS', 'NORMALE',
     JSON_OBJECT(
             'montant', 8000,
             'date_depense', '2026-09-25',
             'type_depense', 'Transport',
             'justification', 'Deplacement professionnel a Casablanca'
     ),
     '2026-09-27 08:30:00',
     NULL),

    (2, 'REQ-2026-0002', 2, 2, 'TERMINEE', 'NORMALE',
     JSON_OBJECT(
             'date_debut', '2026-10-05',
             'date_fin', '2026-10-07',
             'nombre_jours', 3,
             'type_conge', 'Annuel',
             'motif', 'Conge personnel'
     ),
     '2026-09-26 09:00:00',
     '2026-09-26 14:45:00'),

    (3, 'REQ-2026-0003', 3, 3, 'EN_COURS', 'HAUTE',
     JSON_OBJECT(
             'poste', 'Developpeur Java',
             'departement', 'Informatique',
             'nombre_postes', 1,
             'type_contrat', 'CDI',
             'budget_mensuel', 12000,
             'justification', 'Renforcement de l equipe backend'
     ),
     '2026-09-27 10:00:00',
     NULL),

    (4, 'REQ-2026-0004', 1, 6, 'REFUSEE', 'NORMALE',
     JSON_OBJECT(
             'montant', 1200,
             'date_depense', '2026-09-20',
             'type_depense', 'Repas',
             'justification', 'Repas client'
     ),
     '2026-09-25 11:15:00',
     '2026-09-25 12:00:00');

-- ============================================================
-- 15. INSTANCES WORKFLOW
-- ============================================================

INSERT INTO instances_workflow
(id, demande_id, workflow_id, noeud_courant_id,
 statut, date_debut, date_fin)
VALUES
    -- Demande #1 : actuellement Finance
    (1, 1, 1, 4, 'EN_ATTENTE',
     '2026-09-27 08:30:00', NULL),

    -- Demande #2 : terminee
    (2, 2, 2, 14, 'TERMINEE',
     '2026-09-26 09:00:00', '2026-09-26 14:45:00'),

    -- Demande #3 : actuellement Finance
    (3, 3, 3, 18, 'EN_ATTENTE',
     '2026-09-27 10:00:00', NULL),

    -- Demande #4 : refusee
    (4, 4, 1, 7, 'REFUSEE',
     '2026-09-25 11:15:00', '2026-09-25 12:00:00');

-- ============================================================
-- 16. TACHES
-- ============================================================

INSERT INTO taches
(id, instance_id, noeud_id, espace_id, attribue_a,
 statut, date_creation, date_prise_en_charge, date_limite, date_fin)
VALUES
    -- Demande #1 : Manager a approuve
    (1, 1, 2, 1, 3, 'APPROUVEE',
     '2026-09-27 08:31:00',
     '2026-09-27 08:40:00',
     '2026-09-28 08:31:00',
     '2026-09-27 09:00:00'),

    -- Demande #1 : Finance disponible
    (2, 1, 4, 4, NULL, 'EN_ATTENTE',
     '2026-09-27 09:00:00',
     NULL,
     '2026-09-28 09:00:00',
     NULL),

    -- Demande #2 : Manager approuve
    (3, 2, 9, 1, 3, 'APPROUVEE',
     '2026-09-26 09:01:00',
     '2026-09-26 09:20:00',
     '2026-09-27 09:01:00',
     '2026-09-26 10:00:00'),

    -- Demande #2 : RH approuve
    (4, 2, 13, 2, 6, 'APPROUVEE',
     '2026-09-26 10:00:00',
     '2026-09-26 11:00:00',
     '2026-09-27 10:00:00',
     '2026-09-26 14:45:00'),

    -- Demande #3 : RH a valide l'analyse
    (5, 3, 17, 2, 6, 'APPROUVEE',
     '2026-09-27 10:01:00',
     '2026-09-27 10:15:00',
     '2026-09-28 10:01:00',
     '2026-09-27 11:00:00'),

    -- Demande #3 : Finance prise par Nadia
    (6, 3, 18, 4, 4, 'EN_COURS',
     '2026-09-27 11:00:00',
     '2026-09-27 11:20:00',
     '2026-09-28 11:00:00',
     NULL),

    -- Demande #4 : refusee par Manager
    (7, 4, 2, 1, 5, 'REFUSEE',
     '2026-09-25 11:16:00',
     '2026-09-25 11:30:00',
     '2026-09-26 11:16:00',
     '2026-09-25 12:00:00');

-- ============================================================
-- 17. PIECES JOINTES
-- ============================================================

INSERT INTO pieces_jointes
(id, demande_id, ajoute_par, nom_original,
 chemin_fichier, type_fichier, date_creation)
VALUES
    (1, 1, 2,
     'facture_taxi.pdf',
     '/uploads/requests/REQ-2026-0001/facture_taxi.pdf',
     'application/pdf',
     '2026-09-27 08:30:00');

-- ============================================================
-- 18. HISTORIQUE / AUDIT
-- ============================================================

INSERT INTO historique
(id, demande_id, utilisateur_id, espace_id, tache_id,
 action, details, date_action)
VALUES
    -- Demande #1
    (1, 1, 2, NULL, NULL,
     'DEMANDE_CREEE',
     'Mohamed a cree la demande de remboursement.',
     '2026-09-27 08:30:00'),

    (2, 1, 2, NULL, NULL,
     'WORKFLOW_DEMARRE',
     'Le workflow de remboursement a demarre.',
     '2026-09-27 08:30:05'),

    (3, 1, NULL, 1, 1,
     'TACHE_CREEE',
     'Tache creee pour le Workspace Manager.',
     '2026-09-27 08:31:00'),

    (4, 1, 3, 1, 1,
     'TACHE_PRISE',
     'Sara a pris en charge la tache.',
     '2026-09-27 08:40:00'),

    (5, 1, 3, 1, 1,
     'TACHE_APPROUVEE',
     'Sara a approuve la demande.',
     '2026-09-27 09:00:00'),

    (6, 1, NULL, NULL, NULL,
     'CONDITION_EVALUEE',
     'montant > 5000 a retourne TRUE.',
     '2026-09-27 09:00:02'),

    (7, 1, NULL, 4, 2,
     'TACHE_CREEE',
     'Tache Finance creee.',
     '2026-09-27 09:00:03'),

    -- Demande #2
    (8, 2, 2, NULL, NULL,
     'DEMANDE_CREEE',
     'Mohamed a cree une demande de conge.',
     '2026-09-26 09:00:00'),

    (9, 2, 3, 1, 3,
     'TACHE_APPROUVEE',
     'Le Manager a approuve la demande.',
     '2026-09-26 10:00:00'),

    (10, 2, NULL, NULL, NULL,
     'CONDITION_EVALUEE',
     'nombre_jours > 5 a retourne FALSE.',
     '2026-09-26 10:00:05'),

    (11, 2, 6, 2, 4,
     'TACHE_APPROUVEE',
     'RH a valide le conge.',
     '2026-09-26 14:45:00'),

    (12, 2, NULL, NULL, NULL,
     'WORKFLOW_TERMINE',
     'Le workflow de conge est termine.',
     '2026-09-26 14:45:05'),

    -- Demande #3
    (13, 3, 3, NULL, NULL,
     'DEMANDE_CREEE',
     'Sara a cree une demande de recrutement.',
     '2026-09-27 10:00:00'),

    (14, 3, 6, 2, 5,
     'TACHE_APPROUVEE',
     'RH a valide le besoin de recrutement.',
     '2026-09-27 11:00:00'),

    (15, 3, 4, 4, 6,
     'TACHE_PRISE',
     'Nadia a pris la validation du budget.',
     '2026-09-27 11:20:00'),

    -- Demande #4
    (16, 4, 6, NULL, NULL,
     'DEMANDE_CREEE',
     'Youssef a cree une demande de remboursement.',
     '2026-09-25 11:15:00'),

    (17, 4, 5, 1, 7,
     'TACHE_REFUSEE',
     'Ahmed a refuse la demande : justificatif insuffisant.',
     '2026-09-25 12:00:00'),

    (18, 4, NULL, NULL, NULL,
     'WORKFLOW_TERMINE',
     'Le workflow est termine avec le statut REFUSEE.',
     '2026-09-25 12:00:05');

-- ============================================================
-- 19. NOTIFICATIONS
-- ============================================================

INSERT INTO notifications
(id, utilisateur_id, demande_id, tache_id,
 titre, message, lu, date_creation)
VALUES
    (1, 4, 1, 2,
     'Nouvelle tache Finance',
     'Une demande de remboursement de 8000 DH attend une validation Finance.',
     FALSE,
     '2026-09-27 09:00:05'),

    (2, 2, 1, 1,
     'Validation Manager terminee',
     'Votre demande REQ-2026-0001 a ete approuvee par le Manager.',
     TRUE,
     '2026-09-27 09:00:10'),

    (3, 4, 3, 6,
     'Validation budget',
     'La demande de recrutement REQ-2026-0003 attend votre validation.',
     FALSE,
     '2026-09-27 11:00:10'),

    (4, 2, 2, 4,
     'Conge approuve',
     'Votre demande de conge REQ-2026-0002 a ete approuvee.',
     FALSE,
     '2026-09-26 14:45:10'),

    (5, 6, 4, 7,
     'Demande refusee',
     'Votre demande REQ-2026-0004 a ete refusee.',
     FALSE,
     '2026-09-25 12:00:10');

-- ============================================================
-- 20. JOURNAL N8N
-- ============================================================

INSERT INTO journal_n8n
(id, demande_id, evenement, payload_json, statut, date_creation)
VALUES
    (1, 1,
     'TASK_FINANCE_CREATED',
     JSON_OBJECT(
             'reference', 'REQ-2026-0001',
             'workspace', 'Finance',
             'montant', 8000
     ),
     'ENVOYE',
     '2026-09-27 09:00:05'),

    (2, 2,
     'REQUEST_COMPLETED',
     JSON_OBJECT(
             'reference', 'REQ-2026-0002',
             'resultat', 'TERMINEE'
     ),
     'ENVOYE',
     '2026-09-26 14:45:10'),

    (3, 3,
     'TASK_FINANCE_CLAIMED',
     JSON_OBJECT(
             'reference', 'REQ-2026-0003',
             'utilisateur', 'Nadia Benali'
     ),
     'EN_ATTENTE',
     '2026-09-27 11:20:05'),

    (4, 4,
     'REQUEST_REJECTED',
     JSON_OBJECT(
             'reference', 'REQ-2026-0004',
             'resultat', 'REFUSEE'
     ),
     'ECHEC',
     '2026-09-25 12:00:10');

-- ============================================================
-- 21. VERIFICATION RAPIDE
-- ============================================================

SELECT 'utilisateurs' AS table_nom, COUNT(*) AS total
FROM utilisateurs

UNION ALL

SELECT 'espaces', COUNT(*)
FROM espaces

UNION ALL

SELECT 'formulaires', COUNT(*)
FROM formulaires

UNION ALL

SELECT 'workflows', COUNT(*)
FROM workflows

UNION ALL

SELECT 'processus', COUNT(*)
FROM processus

UNION ALL

SELECT 'demandes', COUNT(*)
FROM demandes

UNION ALL

SELECT 'instances_workflow', COUNT(*)
FROM instances_workflow

UNION ALL

SELECT 'taches', COUNT(*)
FROM taches

UNION ALL

SELECT 'historique', COUNT(*)
FROM historique

UNION ALL

SELECT 'notifications', COUNT(*)
FROM notifications;

-- ============================================================
-- FIN DU SEED
-- ============================================================
USE smart_engine;

INSERT INTO utilisateurs (nom, email, mot_de_passe, role_systeme)
VALUES
    ('Admin Smart Engine', 'admin@smartengine.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiYzqqVc1z85JNsSyY9VI7s2rQhT9qa', 'ADMIN'),
    ('Mohamed Employe', 'mohamed@smartengine.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiYzqqVc1z85JNsSyY9VI7s2rQhT9qa', 'USER'),
    ('Nadia Finance', 'nadia@smartengine.local', '$2a$10$7EqJtq98hPqEX7fNZaFWoOhiYzqqVc1z85JNsSyY9VI7s2rQhT9qa', 'USER')
ON DUPLICATE KEY UPDATE nom = VALUES(nom);

INSERT INTO espaces (nom, code, description)
VALUES
    ('Manager', 'MANAGER', 'Espace de validation manager'),
    ('Ressources Humaines', 'RH', 'Espace ressources humaines'),
    ('Direction', 'DIRECTION', 'Espace direction'),
    ('Finance', 'FINANCE', 'Espace finance')
ON DUPLICATE KEY UPDATE nom = VALUES(nom), description = VALUES(description);

INSERT IGNORE INTO membres_espace (espace_id, utilisateur_id)
SELECT e.id, u.id
FROM espaces e
JOIN utilisateurs u ON u.email = 'nadia@smartengine.local'
WHERE e.code = 'FINANCE';
