package com.gestion.collaborateurs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipeRequest {
    @NotBlank
    private String projetNom;
    
    @NotEmpty
    private List<Long> collaborateurIds;
    
    private List<String> competencesRequises;
}
