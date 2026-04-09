package com.gestion.collaborateurs.dto;

import com.gestion.collaborateurs.entity.Collaborateur;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollaborateurSummaryDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private int anneesExperience;
    private String email;
    private String photoUrl;
    private int competencesCount;
    private int projetsCount;
    private List<String> topCompetences;

    public static CollaborateurSummaryDTO fromEntity(Collaborateur c) {
        List<String> top3 = c.getCompetences().stream()
            .filter(cc -> cc.getCompetence() != null)
            .limit(3)
            .map(cc -> cc.getCompetence().getNom())
            .collect(Collectors.toList());

        return CollaborateurSummaryDTO.builder()
            .id(c.getId())
            .nom(c.getNom())
            .prenom(c.getPrenom())
            .poste(c.getPoste())
            .departement(c.getDepartement())
            .anneesExperience(c.getAnneesExperience())
            .email(c.getEmail())
            .photoUrl(c.getPhotoUrl())
            .competencesCount(c.getCompetences().size())
            .projetsCount(c.getProjets().size())
            .topCompetences(top3)
            .build();
    }
}
