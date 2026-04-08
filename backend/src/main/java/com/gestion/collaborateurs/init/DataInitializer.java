package com.gestion.collaborateurs.init;

import com.gestion.collaborateurs.entity.*;
import com.gestion.collaborateurs.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CollaborateurRepository collaborateurRepository;
    private final CompetenceRepository competenceRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;
    private final ProjetRepository projetRepository;
    private final ManagerRepository managerRepository;
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
            
            if (managerRepository.count() == 0) {
                Manager mgr = Manager.builder()
                        .service("Direction Technique")
                        .telephone("01 23 45 67 89")
                        .user(manager)
                        .build();
                managerRepository.save(mgr);
            }
            
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

            // Seed more collaborators for search testing
            seedMoreCollaborators();
        }

        if (projetRepository.count() == 0) {
            log.info("Seeding sample projects...");
            User collabUser = userRepository.findByUsername("collab1").orElseThrow();
            Collaborateur profile1 = collaborateurRepository.findByUserId(collabUser.getId()).orElseThrow();

            Projet p1 = Projet.builder()
                    .nom("Plateforme E-commerce")
                    .description("Développement d'une plateforme de vente en ligne B2C")
                    .dateDebut(LocalDate.of(2023, 1, 1))
                    .dateFin(LocalDate.of(2023, 6, 30))
                    .role("Développeur Full-Stack")
                    .technologies("Java,Spring Boot,Angular,MySQL")
                    .collaborateur(profile1)
                    .build();

            Projet p2 = Projet.builder()
                    .nom("Application Mobile RH")
                    .description("Application de gestion des congés et absences")
                    .dateDebut(LocalDate.of(2023, 7, 1))
                    .dateFin(null)
                    .role("Lead Developer")
                    .technologies("React Native,Node.js,PostgreSQL")
                    .collaborateur(profile1)
                    .build();

            projetRepository.saveAll(List.of(p1, p2));
            log.info("Sample projects seeded.");
        }
    }

    private void seedMoreCollaborators() {
        // Collab 2: Dupont Thomas
        User user2 = createCollabUser("collab2");
        Collaborateur c2 = collaborateurRepository.save(Collaborateur.builder()
            .nom("Dupont").prenom("Thomas").poste("DevOps Engineer")
            .departement("Infrastructure").anneesExperience(6)
            .email("t.dupont@company.com").user(user2).build());
        
        addSkill(c2, "Docker", Categorie.OUTIL, Niveau.EXPERT);
        addSkill(c2, "Kubernetes", Categorie.OUTIL, Niveau.AVANCE);
        addSkill(c2, "Linux", Categorie.TECHNIQUE, Niveau.EXPERT);

        // Collab 3: Bernard Julie
        User user3 = createCollabUser("collab3");
        Collaborateur c3 = collaborateurRepository.save(Collaborateur.builder()
            .nom("Bernard").prenom("Julie").poste("Data Scientist")
            .departement("Data").anneesExperience(3)
            .email("j.bernard@company.com").user(user3).build());
        
        addSkill(c3, "Python", Categorie.TECHNIQUE, Niveau.EXPERT);
        addSkill(c3, "TensorFlow", Categorie.TECHNIQUE, Niveau.AVANCE);
        addSkill(c3, "SQL", Categorie.OUTIL, Niveau.AVANCE);

        // Collab 4: Leroy Marc
        User user4 = createCollabUser("collab4");
        Collaborateur c4 = collaborateurRepository.save(Collaborateur.builder()
            .nom("Leroy").prenom("Marc").poste("UX Designer")
            .departement("Design").anneesExperience(5)
            .email("m.leroy@company.com").user(user4).build());
        
        addSkill(c4, "Figma", Categorie.OUTIL, Niveau.EXPERT);
        addSkill(c4, "CSS", Categorie.TECHNIQUE, Niveau.AVANCE);
        addSkill(c4, "Angular", Categorie.TECHNIQUE, Niveau.INTERMEDIAIRE);
    }

    private User createCollabUser(String username) {
        return userRepository.save(User.builder()
            .username(username)
            .password(passwordEncoder.encode("password123"))
            .role(Role.COLLABORATEUR)
            .enabled(true)
            .build());
    }

    private void addSkill(Collaborateur collab, String compName, Categorie cat, Niveau niveau) {
        Competence comp = competenceRepository.findByNomIgnoreCase(compName)
            .orElseGet(() -> competenceRepository.save(Competence.builder().nom(compName).categorie(cat).build()));
        
        collaborateurCompetenceRepository.save(CollaborateurCompetence.builder()
            .collaborateur(collab)
            .competence(comp)
            .niveau(niveau)
            .dateAcquisition(LocalDate.now().minusYears(1))
            .build());
    }
}
