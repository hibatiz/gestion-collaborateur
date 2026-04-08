package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.CompetenceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompetenceLogRepository extends JpaRepository<CompetenceLog, Long> {
    
    List<CompetenceLog> findByCollaborateurIdOrderByDateChangementAsc(Long collaborateurId);
    
    List<CompetenceLog> findByCollaborateurIdAndCompetenceIdOrderByDateChangementAsc(Long collaborateurId, Long competenceId);
}
