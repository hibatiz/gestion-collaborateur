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

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(name = "cv")
public class CV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne
    @JoinColumn(name = "collaborateur_id")
    @ToString.Exclude
    private Collaborateur collaborateur;

    @Column
    private LocalDateTime dateGeneration;

    @Column(length = 100)
    @Builder.Default
    private String templateUtilise = "default";

    @Column(length = 10)
    @Builder.Default
    private String format = "PDF";

    @Column
    private int version;

    @Column(length = 300)
    private String nomFichier;

    @PrePersist
    protected void onCreate() {
        if (dateGeneration == null) {
            dateGeneration = LocalDateTime.now();
        }
    }
}
