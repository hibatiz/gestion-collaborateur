package com.gestion.collaborateurs.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "collaborateur")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Collaborateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(length = 150)
    private String poste;

    @Column(length = 100)
    private String departement;

    private int anneesExperience;

    @Column(length = 200)
    private String email;

    @Column(length = 20)
    private String telephone;

    @Column(length = 500)
    private String photoUrl;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "collaborateur", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private Set<CollaborateurCompetence> competences = new HashSet<>();

    @OneToMany(mappedBy = "collaborateur", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dateDebut DESC")
    @Builder.Default
    @ToString.Exclude
    private Set<Projet> projets = new HashSet<>();

    @OneToMany(mappedBy = "collaborateur", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @ToString.Exclude
    private Set<CV> cvs = new HashSet<>();
}
