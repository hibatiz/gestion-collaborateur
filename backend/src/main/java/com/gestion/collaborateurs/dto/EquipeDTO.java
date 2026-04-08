package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EquipeDTO {
    private String projetNom;
    private List<CollaborateurSummaryDTO> membres;
    private List<String> competencesCouvertes;
    private List<String> competencesManquantes;
    private boolean hasGap;
}
