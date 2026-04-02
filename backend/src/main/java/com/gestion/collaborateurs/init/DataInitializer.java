package com.gestion.collaborateurs.init;

import com.gestion.collaborateurs.entity.Categorie;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.CollaborateurCompetence;
import com.gestion.collaborateurs.entity.Competence;
import com.gestion.collaborateurs.entity.Niveau;
import com.gestion.collaborateurs.entity.Role;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.CompetenceRepository;
import com.gestion.collaborateurs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CollaborateurRepository collaborateurRepository;
    private final CompetenceRepository competenceRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            log.info("Database empty, initializing seed data...");

            User collab = User.builder()
                    .username("collab1")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.COLLABORATEUR)
                    .enabled(true)
                    .build();

            User manager = User.builder()
                    .username("manager1")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.MANAGER)
                    .enabled(true)
                    .build();

            userRepository.save(collab);
            userRepository.save(manager);
            
            // Create Collaborateur Profile
            Collaborateur profile1 = Collaborateur.builder()
                    .nom("Martin")
                    .prenom("Sophie")
                    .poste("Développeuse Full-Stack")
                    .departement("Engineering")
                    .anneesExperience(4)
                    .email("s.martin@company.com")
                    .user(collab)
                    .build();
            collaborateurRepository.save(profile1);

            // Create some reference competencies
            Competence compJava = competenceRepository.save(Competence.builder().nom("Java").categorie(Categorie.TECHNIQUE).build());
            Competence compAngular = competenceRepository.save(Competence.builder().nom("Angular").categorie(Categorie.TECHNIQUE).build());
            Competence compGit = competenceRepository.save(Competence.builder().nom("Git").categorie(Categorie.OUTIL).build());

            // Link competencies to the cooperateur
            collaborateurCompetenceRepository.save(CollaborateurCompetence.builder()
                    .collaborateur(profile1)
                    .competence(compJava)
                    .niveau(Niveau.AVANCE)
                    .dateAcquisition(LocalDate.now().minusYears(3))
                    .build());
                    
            collaborateurCompetenceRepository.save(CollaborateurCompetence.builder()
                    .collaborateur(profile1)
                    .competence(compAngular)
                    .niveau(Niveau.INTERMEDIAIRE)
                    .dateAcquisition(LocalDate.now().minusYears(1))
                    .build());

            collaborateurCompetenceRepository.save(CollaborateurCompetence.builder()
                    .collaborateur(profile1)
                    .competence(compGit)
                    .niveau(Niveau.AVANCE)
                    .dateAcquisition(LocalDate.now().minusYears(4))
                    .build());

            log.info("Seed data initialized. Users created: collab1, manager1, with competences added");
        }
    }
}
