package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CollabRowDTO {
    private Long collaborateurId;
    private String nom;
    private String prenom;
    private String poste;
    private String photoUrl;
    private Map<String, String> niveaux;
}
