package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollabDashboardDTO {
    private Long collaborateurId;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private String photoUrl;
    private int anneesExperience;
    private String email;
    private int totalCompetences;
    private int totalProjets;
    private Map<String, Long> competencesParCategorie;
    private Map<String, Long> niveauxDistribution;
    private List<ProjetDTO> projetsRecents;
    private List<EvolutionDTO> evolution;
}
