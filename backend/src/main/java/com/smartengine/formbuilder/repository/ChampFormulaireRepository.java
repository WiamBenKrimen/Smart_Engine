package com.smartengine.formbuilder.repository;

import com.smartengine.formbuilder.entity.ChampFormulaire;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChampFormulaireRepository extends JpaRepository<ChampFormulaire, Long> {
    List<ChampFormulaire> findByFormulaire_IdOrderByOrdreAffichageAsc(Long id);
    void deleteByFormulaire_Id(Long id);
    int countByFormulaire_Id(Long id);
}
