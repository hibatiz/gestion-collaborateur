package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaborateurDetailDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private int anneesExperience;
    private String email;
    private String telephone;
    private String photoUrl;
    private List<CollabCompetenceDTO> competences;
    private List<ProjetDTO> projets;
    private UserSummaryDTO user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollabCompetenceDTO {
        private Long id;
        private String niveau;
        private String dateAcquisition;
        private CompetenceSummaryDTO competence;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompetenceSummaryDTO {
        private Long id;
        private String nom;
        private String categorie;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummaryDTO {
        private String username;
        private String role;
    }
}
