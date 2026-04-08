package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.Projet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjetRepository extends JpaRepository<Projet, Long> {
    List<Projet> findByCollaborateurIdOrderByDateDebutDesc(Long collaborateurId);
    List<Projet> findByCollaborateurIdAndTechnologiesContainingIgnoreCase(Long collaborateurId, String technology);
    boolean existsByIdAndCollaborateurId(Long projetId, Long collaborateurId);
}
