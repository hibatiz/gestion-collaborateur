package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.entity.*;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.ProjetRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PdfServiceTest {

    @Mock
    private CollaborateurRepository collaborateurRepository;
    @Mock
    private CollaborateurCompetenceRepository collaborateurCompetenceRepository;
    @Mock
    private ProjetRepository projetRepository;

    @InjectMocks
    private PdfService pdfService;

    @Test
    void generateCv_withFullProfile_returnsNonEmptyByteArray() {
        // Arrange
        Collaborateur collab = new Collaborateur();
        collab.setId(1L);
        collab.setNom("Martin");
        collab.setPrenom("Sophie");
        collab.setPoste("Dev Java");
        collab.setDepartement("IT");
        
        Competence c1 = new Competence(1L, "Java", Categorie.TECHNIQUE);
        CollaborateurCompetence cc1 = new CollaborateurCompetence(1L, collab, c1, Niveau.EXPERT, LocalDate.now());
        collab.setCompetences(new HashSet<>(Arrays.asList(cc1)));
        
        Projet p1 = new Projet();
        p1.setNom("Project Alpha");
        p1.setDateDebut(LocalDate.now().minusMonths(6));
        p1.setTechnologies("Java, Spring");
        collab.setProjets(new HashSet<>(Arrays.asList(p1)));

        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        when(collaborateurCompetenceRepository.findByCollaborateurId(1L)).thenReturn(new ArrayList<>(Arrays.asList(cc1)));
        when(projetRepository.findByCollaborateurIdOrderByDateDebutDesc(1L)).thenReturn(new ArrayList<>(Arrays.asList(p1)));

        // Act
        byte[] result = pdfService.generateCv(1L);

        // Assert
        assertNotNull(result);
        assertTrue(result.length > 0);
        // Verify PDF Header
        byte[] header = {0x25, 0x50, 0x44, 0x46}; // %PDF
        byte[] resultHeader = Arrays.copyOf(result, 4);
        assertArrayEquals(header, resultHeader);
    }

    @Test
    void generateCv_withEmptyCompetences_stillGenerates() {
        Collaborateur collab = new Collaborateur();
        collab.setId(1L);
        collab.setNom("Empty");
        collab.setCompetences(new HashSet<>());
        collab.setProjets(new HashSet<>());

        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        when(collaborateurCompetenceRepository.findByCollaborateurId(1L)).thenReturn(new ArrayList<>());
        when(projetRepository.findByCollaborateurIdOrderByDateDebutDesc(1L)).thenReturn(new ArrayList<>());

        byte[] result = pdfService.generateCv(1L);

        assertNotNull(result);
        assertTrue(result.length > 0);
    }

    @Test
    void generateCv_withInvalidId_throwsRuntimeException() {
        when(collaborateurRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(RuntimeException.class, () -> pdfService.generateCv(99L));
    }
}
