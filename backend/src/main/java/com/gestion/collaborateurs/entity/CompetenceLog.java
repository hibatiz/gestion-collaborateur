package com.gestion.collaborateurs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "competence_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class CompetenceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    @ToString.Exclude
    private Collaborateur collaborateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "competence_id", nullable = false)
    private Competence competence;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Niveau ancienNiveau;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Niveau nouveauNiveau;

    @Column(nullable = false)
    private LocalDateTime dateChangement;

    @PrePersist
    protected void onCreate() {
        if (dateChangement == null) {
            dateChangement = LocalDateTime.now();
        }
    }
}
