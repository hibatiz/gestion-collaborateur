package com.gestion.collaborateurs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetRequest {

    @NotBlank(message = "Le nom du projet est obligatoire")
    @Size(max = 200)
    private String nom;

    private String description;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDate dateDebut;

    private LocalDate dateFin;

    @Size(max = 150)
    private String role;

    @Size(max = 500)
    private String technologies;
}
