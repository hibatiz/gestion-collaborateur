package com.gestion.collaborateurs.repository;

import com.gestion.collaborateurs.entity.Collaborateur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.gestion.collaborateurs.entity.Niveau;
import java.util.List;
import java.util.Optional;

@Repository
public interface CollaborateurRepository extends JpaRepository<Collaborateur, Long> {
    Optional<Collaborateur> findByUserId(Long userId);

    Page<Collaborateur> findAll(Pageable pageable);

    Page<Collaborateur> findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(
        String nom, String prenom, Pageable pageable);

    @Query("SELECT DISTINCT c FROM Collaborateur c " +
           "LEFT JOIN c.competences cc " +
           "LEFT JOIN cc.competence comp " +
           "WHERE (:nom IS NULL OR LOWER(c.nom) LIKE LOWER(CONCAT('%',:nom,'%')) " +
           "OR LOWER(c.prenom) LIKE LOWER(CONCAT('%',:nom,'%'))) " +
           "AND (:competence IS NULL OR LOWER(comp.nom) LIKE LOWER(CONCAT('%',:competence,'%'))) " +
           "AND (:niveauEnum IS NULL OR cc.niveau = :niveauEnum) " +
           "AND (:departement IS NULL OR LOWER(c.departement) = LOWER(:departement))")
    Page<Collaborateur> searchCollaborateurs(
        @Param("nom") String nom,
        @Param("competence") String competence,
        @Param("niveauEnum") Niveau niveauEnum,
        @Param("departement") String departement,
        Pageable pageable);

    @Query("SELECT DISTINCT c FROM Collaborateur c " +
           "LEFT JOIN FETCH c.competences cc " +
           "LEFT JOIN FETCH cc.competence " +
           "LEFT JOIN FETCH c.projets " +
           "ORDER BY c.nom ASC")
    List<Collaborateur> findAllWithCompetencesAndProjets();

    @Query("SELECT DISTINCT c FROM Collaborateur c " +
           "LEFT JOIN FETCH c.competences cc " +
           "LEFT JOIN FETCH cc.competence " +
           "WHERE c.id IN :ids")
    List<Collaborateur> findAllByIdWithCompetences(@Param("ids") List<Long> ids);
    @Query("SELECT DISTINCT c FROM Collaborateur c " +
           "LEFT JOIN FETCH c.competences cc " +
           "LEFT JOIN FETCH cc.competence " +
           "LEFT JOIN FETCH c.projets " +
           "WHERE c.id = :id")
    Optional<Collaborateur> findByIdWithDetails(@Param("id") Long id);
}
