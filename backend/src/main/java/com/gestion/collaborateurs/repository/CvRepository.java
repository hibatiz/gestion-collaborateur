package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.CV;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CvRepository extends JpaRepository<CV, Long> {
    List<CV> findByCollaborateurIdOrderByDateGenerationDesc(Long collaborateurId);
    int countByCollaborateurId(Long collaborateurId);
    boolean existsByIdAndCollaborateurId(Long cvId, Long collaborateurId);
}
