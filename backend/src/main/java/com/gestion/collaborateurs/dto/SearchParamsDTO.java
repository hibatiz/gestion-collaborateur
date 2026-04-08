package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchParamsDTO {
    private String nom;
    private String competence;
    private String niveau;
    private String departement;
}
