package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.CompetenceDTO;
import com.gestion.collaborateurs.dto.CompetenceRequest;
import com.gestion.collaborateurs.dto.CollaborateurDTO;
import com.gestion.collaborateurs.dto.NiveauRequest;
import com.gestion.collaborateurs.dto.UpdateProfileRequest;
import com.gestion.collaborateurs.entity.*;
import com.gestion.collaborateurs.exception.ConflictException;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.exception.UnauthorizedException;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.CompetenceLogRepository;
import com.gestion.collaborateurs.repository.CompetenceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CollaborateurServiceTest {

    @Mock
    private CollaborateurRepository collaborateurRepository;
    @Mock
    private CompetenceRepository competenceRepository;
    @Mock
    private CollaborateurCompetenceRepository ccRepository;
    @Mock
    private CompetenceLogRepository competenceLogRepository;
    @Mock
    private FileStorageService fileStorageService;

    @InjectMocks
    private CollaborateurService collaborateurService;

    private User buildUser(Long id, String username) {
        User u = new User();
        u.setId(id);
        u.setUsername(username);
        u.setRole(Role.COLLABORATEUR);
        return u;
    }

    private Collaborateur buildCollab(Long id, User user) {
        Collaborateur c = new Collaborateur();
        c.setId(id);
        c.setNom("Martin");
        c.setPrenom("Sophie");
        c.setPoste("Dev");
        c.setUser(user);
        c.setCompetences(new HashSet<>());
        c.setProjets(new HashSet<>());
        return c;
    }

    @Test
    void getCollaborateurById_withValidId_returnsDTO() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));

        CollaborateurDTO result = collaborateurService.getCollaborateurById(1L);

        assertNotNull(result);
        assertEquals("Martin", result.getNom());
        assertEquals("Sophie", result.getPrenom());
    }

    @Test
    void getCollaborateurById_withInvalidId_throwsResourceNotFoundException() {
        when(collaborateurRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> collaborateurService.getCollaborateurById(99L));
    }

    @Test
    void updateProfile_withAuthorizedUser_updatesSuccessfully() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setNom("Dupont");
        request.setPrenom("Sophie");
        request.setPoste("Manager");

        CollaborateurDTO result = collaborateurService.updateProfile(1L, request, 1L);

        assertEquals("Dupont", result.getNom());
        verify(collaborateurRepository, times(1)).save(any(Collaborateur.class));
    }

    @Test
    void updateProfile_withUnauthorizedUser_throwsUnauthorizedException() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        UpdateProfileRequest request = new UpdateProfileRequest();

        assertThrows(UnauthorizedException.class, () -> collaborateurService.updateProfile(1L, request, 2L));
    }

    @Test
    void addCompetence_newCompetence_createsSuccessfully() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        
        Competence competence = new Competence();
        competence.setId(10L);
        competence.setNom("Java");
        competence.setCategorie(Categorie.TECHNIQUE);

        when(competenceRepository.findByNomIgnoreCase("Java")).thenReturn(Optional.empty());
        when(competenceRepository.save(any(Competence.class))).thenReturn(competence);
        when(ccRepository.findByCollaborateurIdAndCompetenceId(1L, 10L)).thenReturn(Optional.empty());

        CompetenceRequest request = new CompetenceRequest();
        request.setNom("Java");
        request.setCategorie("TECHNIQUE");
        request.setNiveau("AVANCE");

        CompetenceDTO result = collaborateurService.addCompetence(1L, request, 1L);

        assertNotNull(result);
        verify(ccRepository, times(1)).save(any(CollaborateurCompetence.class));
        verify(competenceLogRepository, times(1)).save(any(CompetenceLog.class));
    }

    @Test
    void addCompetence_duplicateCompetence_throwsConflictException() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        
        Competence competence = new Competence();
        competence.setId(10L);
        competence.setNom("Java");
        when(competenceRepository.findByNomIgnoreCase("Java")).thenReturn(Optional.of(competence));
        
        CollaborateurCompetence existing = new CollaborateurCompetence();
        when(ccRepository.findByCollaborateurIdAndCompetenceId(1L, 10L)).thenReturn(Optional.of(existing));

        CompetenceRequest request = new CompetenceRequest();
        request.setNom("Java");
        request.setCategorie("TECHNIQUE");
        request.setNiveau("AVANCE");

        assertThrows(ConflictException.class, () -> collaborateurService.addCompetence(1L, request, 1L));
    }

    @Test
    void deleteCompetence_byOwner_deletesSuccessfully() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        
        CollaborateurCompetence cc = new CollaborateurCompetence();
        when(ccRepository.findByCollaborateurIdAndCompetenceId(1L, 10L)).thenReturn(Optional.of(cc));

        collaborateurService.deleteCompetence(1L, 10L, 1L);

        verify(ccRepository, times(1)).delete(cc);
    }

    @Test
    void updateNiveau_logsChange() {
        User user = buildUser(1L, "collab1");
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        
        Competence comp = new Competence();
        comp.setId(10L);
        comp.setNom("Java");
        comp.setCategorie(Categorie.TECHNIQUE);
        
        CollaborateurCompetence cc = new CollaborateurCompetence();
        cc.setCollaborateur(collab);
        cc.setCompetence(comp);
        cc.setNiveau(Niveau.DEBUTANT);
        
        when(ccRepository.findByCollaborateurIdAndCompetenceId(1L, 10L)).thenReturn(Optional.of(cc));

        NiveauRequest request = new NiveauRequest();
        request.setNiveau("EXPERT");

        CompetenceDTO result = collaborateurService.updateNiveau(1L, 10L, request, 1L);

        assertEquals("EXPERT", result.getNiveau());
        verify(competenceLogRepository, times(1)).save(argThat(log -> 
            log.getAncienNiveau() == Niveau.DEBUTANT && log.getNouveauNiveau() == Niveau.EXPERT
        ));
    }
}
