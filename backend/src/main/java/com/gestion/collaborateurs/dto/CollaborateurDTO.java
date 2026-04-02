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
public class CollaborateurDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private int anneesExperience;
    private String email;
    private String telephone;
    private String photoUrl;
    private List<CompetenceDTO> competences;
}
