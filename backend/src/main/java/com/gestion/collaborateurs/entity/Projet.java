package com.gestion.collaborateurs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "projet")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate dateDebut;

    @Column(nullable = true)
    private LocalDate dateFin;

    @Column(length = 150)
    private String role;

    @Column(length = 500)
    private String technologies;

    @ManyToOne
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Collaborateur collaborateur;

    public int calculateDureeEnMois() {
        if (dateDebut == null) return 0;
        java.time.LocalDate end = (dateFin != null) ? dateFin : java.time.LocalDate.now();
        return (int) java.time.temporal.ChronoUnit.MONTHS.between(dateDebut, end);
    }
}
