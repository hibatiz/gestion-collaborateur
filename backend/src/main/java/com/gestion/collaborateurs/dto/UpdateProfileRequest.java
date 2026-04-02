package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String nom;
    private String prenom;
    private String poste;
    private String departement;
    private int anneesExperience;
    private String email;
    private String telephone;
}
