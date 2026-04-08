package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NiveauChangeDTO {
    private Long id;
    private String ancienNiveau;
    private String nouveauNiveau;
    private LocalDateTime dateChangement;
    private String description;
}
