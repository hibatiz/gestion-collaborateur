package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.Categorie;
import com.gestion.collaborateurs.entity.Competence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompetenceRepository extends JpaRepository<Competence, Long> {
    List<Competence> findByCategorie(Categorie categorie);
    Optional<Competence> findByNomIgnoreCase(String nom);
}
