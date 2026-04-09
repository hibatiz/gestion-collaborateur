package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.ProjetDTO;
import com.gestion.collaborateurs.dto.ProjetRequest;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.Projet;
import com.gestion.collaborateurs.entity.Role;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.exception.UnauthorizedException;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.ProjetRepository;
import jakarta.validation.ValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProjetServiceTest {

    @Mock
    private ProjetRepository projetRepository;
    @Mock
    private CollaborateurRepository collaborateurRepository;

    @InjectMocks
    private ProjetService projetService;

    private User buildUser(Long id) {
        User u = new User();
        u.setId(id);
        u.setRole(Role.COLLABORATEUR);
        return u;
    }

    private Collaborateur buildCollab(Long id, User user) {
        Collaborateur c = new Collaborateur();
        c.setId(id);
        c.setUser(user);
        return c;
    }

    @Test
    void addProjet_withValidData_persistsSuccessfully() {
        User user = buildUser(1L);
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));

        ProjetRequest request = new ProjetRequest();
        request.setNom("Test Project");
        request.setDateDebut(LocalDate.of(2023, 1, 1));
        request.setDateFin(LocalDate.of(2023, 6, 30));

        when(projetRepository.save(any(Projet.class))).thenAnswer(i -> {
            Projet p = i.getArgument(0);
            p.setId(100L);
            return p;
        });

        ProjetDTO result = projetService.addProjet(1L, request, 1L);

        assertNotNull(result);
        assertEquals("Test Project", result.getNom());
        verify(projetRepository, times(1)).save(any(Projet.class));
    }

    @Test
    void addProjet_withDateFinBeforeDateDebut_throwsIllegalArgumentException() {
        User user = buildUser(1L);
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));

        ProjetRequest request = new ProjetRequest();
        request.setDateDebut(LocalDate.of(2023, 6, 1));
        request.setDateFin(LocalDate.of(2023, 1, 1));

        assertThrows(ValidationException.class, () -> projetService.addProjet(1L, request, 1L));
    }

    @Test
    void addProjet_withNullDateFin_isEnCours() {
        User user = buildUser(1L);
        Collaborateur collab = buildCollab(1L, user);
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));

        ProjetRequest request = new ProjetRequest();
        request.setNom("Ongoing");
        request.setDateDebut(LocalDate.of(2023, 1, 1));
        request.setDateFin(null);

        when(projetRepository.save(any(Projet.class))).thenAnswer(i -> i.getArgument(0));

        ProjetDTO result = projetService.addProjet(1L, request, 1L);

        assertTrue(result.isEnCours());
        assertNull(result.getDateFin());
        assertTrue(result.getDureeEnMois() >= 0);
    }

    @Test
    void deleteProjet_byOwner_deletesSuccessfully() {
        User user = buildUser(1L);
        Collaborateur collab = buildCollab(1L, user);
        
        Projet projet = new Projet();
        projet.setId(10L);
        projet.setCollaborateur(collab);
        
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        when(projetRepository.findById(10L)).thenReturn(Optional.of(projet));
        when(projetRepository.existsByIdAndCollaborateurId(10L, 1L)).thenReturn(true);

        projetService.deleteProjet(1L, 10L, 1L);

        verify(projetRepository, times(1)).deleteById(10L);
    }

    @Test
    void deleteProjet_byNonOwner_throwsUnauthorizedException() {
        User user = buildUser(1L);
        Collaborateur collab = buildCollab(1L, user);
        
        Projet projet = new Projet();
        projet.setId(10L);
        projet.setCollaborateur(collab);
        
        when(collaborateurRepository.findById(1L)).thenReturn(Optional.of(collab));
        when(projetRepository.findById(10L)).thenReturn(Optional.of(projet));

        assertThrows(UnauthorizedException.class, () -> projetService.deleteProjet(1L, 10L, 2L));
    }
}
