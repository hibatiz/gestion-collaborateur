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
public class EvolutionDTO {
    private Long competenceId;
    private String competenceNom;
    private String categorie;
    private List<NiveauChangeDTO> historique;
}
