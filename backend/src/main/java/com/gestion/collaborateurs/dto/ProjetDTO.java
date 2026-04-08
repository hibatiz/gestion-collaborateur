package com.gestion.collaborateurs.dto;

import com.gestion.collaborateurs.entity.Projet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjetDTO {
    private Long id;
    private String nom;
    private String description;
    private LocalDate dateDebut;
    private LocalDate dateFin;
    private String role;
    private String technologies;
    private long dureeEnMois;
    private boolean enCours;

    public static ProjetDTO fromEntity(Projet p) {
        boolean isEnCours = (p.getDateFin() == null);
        long duree = ChronoUnit.MONTHS.between(
                p.getDateDebut(),
                p.getDateFin() != null ? p.getDateFin() : LocalDate.now()
        );

        return ProjetDTO.builder()
                .id(p.getId())
                .nom(p.getNom())
                .description(p.getDescription())
                .dateDebut(p.getDateDebut())
                .dateFin(p.getDateFin())
                .role(p.getRole())
                .technologies(p.getTechnologies())
                .dureeEnMois(duree)
                .enCours(isEnCours)
                .build();
    }
}
