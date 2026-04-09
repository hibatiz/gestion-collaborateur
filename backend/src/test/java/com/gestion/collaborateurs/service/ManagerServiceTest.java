package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.EnhancedDashboardDTO;
import com.gestion.collaborateurs.dto.MatriceDTO;
import com.gestion.collaborateurs.dto.EquipeRequest;
import com.gestion.collaborateurs.dto.EquipeDTO;
import com.gestion.collaborateurs.entity.*;
import com.gestion.collaborateurs.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ManagerServiceTest {

    @Mock
    private CollaborateurRepository collaborateurRepository;
    @Mock
    private CompetenceRepository competenceRepository;
    @Mock
    private CollaborateurCompetenceRepository ccRepository;
    @Mock
    private ProjetRepository projetRepository;
    @Mock
    private ManagerRepository managerRepository;

    @InjectMocks
    private ManagerService managerService;

    @Test
    void getEnhancedDashboard_returnsCorrectTotals() {
        // Arrange
        when(collaborateurRepository.count()).thenReturn(10L);
        when(competenceRepository.count()).thenReturn(20L);
        when(projetRepository.count()).thenReturn(5L);
        when(collaborateurRepository.findAll()).thenReturn(new ArrayList<>());
        when(collaborateurRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(new ArrayList<>()));
        when(competenceRepository.findTop5Competences(any(Pageable.class))).thenReturn(new ArrayList<>());
        when(competenceRepository.countByNiveau()).thenReturn(new ArrayList<>());

        // Act
        EnhancedDashboardDTO result = managerService.getEnhancedDashboard();

        // Assert
        assertEquals(10L, result.getTotalCollaborateurs());
        assertEquals(20L, result.getTotalCompetences());
    }

    @Test
    void getMatrice_returnsPopulatedData() {
        // Arrange
        Collaborateur c1 = new Collaborateur();
        c1.setId(1L); c1.setNom("A"); c1.setPrenom("B");
        c1.setCompetences(new HashSet<>());
        
        when(collaborateurRepository.findAllWithCompetencesAndProjets()).thenReturn(Arrays.asList(c1));
        when(competenceRepository.findAllByOrderByNomAsc()).thenReturn(new ArrayList<>());

        // Act
        MatriceDTO result = managerService.getMatrice();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getCollaborateurs().size());
    }

    @Test
    void constituerEquipe_withAllCompetencesCovered_hasGapFalse() {
        // Arrange
        Collaborateur c1 = new Collaborateur();
        c1.setId(1L);
        Competence comp = new CategorieCompetence().getJava(); // Hypothetical helper or manual build
        comp = new Competence(10L, "Java", Categorie.TECHNIQUE);
        CollaborateurCompetence cc1 = new CollaborateurCompetence(1L, c1, comp, Niveau.AVANCE, LocalDate.now());
        c1.setCompetences(new HashSet<>(Arrays.asList(cc1)));

        when(collaborateurRepository.findAllByIdWithCompetences(Arrays.asList(1L))).thenReturn(Arrays.asList(c1));

        EquipeRequest request = new EquipeRequest();
        request.setCollaborateurIds(Arrays.asList(1L));
        request.setCompetencesRequises(Arrays.asList("Java"));
        request.setProjetNom("New Project");

        // Act
        EquipeDTO result = managerService.constituerEquipe(request);

        // Assert
        assertFalse(result.isHasGap());
        assertTrue(result.getCompetencesManquantes().isEmpty());
    }

    @Test
    void constituerEquipe_withMissingCompetences_hasGapTrue() {
        // Arrange
        Collaborateur c1 = new Collaborateur();
        c1.setId(1L);
        c1.setCompetences(new HashSet<>());

        when(collaborateurRepository.findAllByIdWithCompetences(Arrays.asList(1L))).thenReturn(Arrays.asList(c1));

        EquipeRequest request = new EquipeRequest();
        request.setCollaborateurIds(Arrays.asList(1L));
        request.setCompetencesRequises(Arrays.asList("Kubernetes"));
        request.setProjetNom("Next Gen");

        // Act
        EquipeDTO result = managerService.constituerEquipe(request);

        // Assert
        assertTrue(result.isHasGap());
        assertTrue(result.getCompetencesManquantes().contains("Kubernetes"));
    }

    // Helper to simulate categories
    private static class CategorieCompetence {
        Competence getJava() { return new Competence(10L, "Java", Categorie.TECHNIQUE); }
    }
}
