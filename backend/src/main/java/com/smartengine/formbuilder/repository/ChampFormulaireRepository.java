package com.smartengine.formbuilder.repository;

import com.smartengine.formbuilder.entity.ChampFormulaire;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampFormulaireRepository extends JpaRepository<ChampFormulaire, Long> {
    java.util.List<ChampFormulaire> findByFormulaire_IdOrderByOrdreAffichageAsc(Long id);
    void deleteByFormulaire_Id(Long id);
}
