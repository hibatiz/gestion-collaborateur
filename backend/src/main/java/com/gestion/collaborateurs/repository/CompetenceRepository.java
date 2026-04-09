package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.Categorie;
import com.gestion.collaborateurs.entity.Competence;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetenceRepository extends JpaRepository<Competence, Long> {
    List<Competence> findByCategorie(Categorie categorie);
    Optional<Competence> findByNomIgnoreCase(String nom);
    List<Competence> findAllByOrderByNomAsc();

    @Query("SELECT comp.nom, COUNT(cc) as cnt FROM CollaborateurCompetence cc " +
           "JOIN cc.competence comp GROUP BY comp.nom ORDER BY cnt DESC")
    List<Object[]> findTop5Competences(Pageable pageable);

    @Query("SELECT cc.niveau, COUNT(cc) FROM CollaborateurCompetence cc " +
           "GROUP BY cc.niveau")
    List<Object[]> countByNiveau();

    @Query("SELECT DISTINCT c.departement FROM Collaborateur c " +
           "WHERE c.departement IS NOT NULL ORDER BY c.departement ASC")
    List<String> findAllDepartements();
}
