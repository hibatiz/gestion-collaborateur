package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.CollaborateurCompetence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollaborateurCompetenceRepository extends JpaRepository<CollaborateurCompetence, Long> {
    List<CollaborateurCompetence> findByCollaborateurId(Long collaborateurId);
    Optional<CollaborateurCompetence> findByCollaborateurIdAndCompetenceId(Long collaborateurId, Long competenceId);
}
