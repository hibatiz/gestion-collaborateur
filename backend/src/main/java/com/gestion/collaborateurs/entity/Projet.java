package com.gestion.collaborateurs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "projet")
public class Projet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
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
    @ToString.Exclude
    private Collaborateur collaborateur;

    public int calculateDureeEnMois() {
        if (dateDebut == null) return 0;
        java.time.LocalDate end = (dateFin != null) ? dateFin : java.time.LocalDate.now();
        return (int) java.time.temporal.ChronoUnit.MONTHS.between(dateDebut, end);
    }
}
