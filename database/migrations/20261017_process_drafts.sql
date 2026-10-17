-- Apply once to an existing database if automatic Hibernate schema updates are disabled.
ALTER TABLE champs_formulaire ADD COLUMN placeholder VARCHAR(500) NULL;
ALTER TABLE champs_formulaire ADD COLUMN help_text VARCHAR(1000) NULL;
CREATE TABLE IF NOT EXISTS processus_brouillons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  owner_email VARCHAR(150) NOT NULL,
  payload LONGTEXT NOT NULL,
  formulaire_id BIGINT NULL,
  owns_form BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_brouillon_formulaire FOREIGN KEY (formulaire_id) REFERENCES formulaires(id)
) ENGINE=InnoDB;
