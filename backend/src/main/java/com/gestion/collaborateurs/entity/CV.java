package com.gestion.collaborateurs.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "cv")
public class CV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "collaborateur_id")
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
