package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.ProjetDTO;
import com.gestion.collaborateurs.dto.ProjetRequest;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.Projet;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.exception.UnauthorizedException;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.ProjetRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final CollaborateurRepository collaborateurRepository;

    public List<ProjetDTO> getProjets(Long collaborateurId) {
        if (!collaborateurRepository.existsById(collaborateurId)) {
            throw new ResourceNotFoundException("Collaborateur non trouvé");
        }
        return projetRepository.findByCollaborateurIdOrderByDateDebutDesc(collaborateurId)
                .stream()
                .map(ProjetDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjetDTO addProjet(Long collaborateurId, ProjetRequest request, Long requestingUserId) {
        Collaborateur collaborateur = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé"));

        if (!collaborateur.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à ajouter des projets pour ce collaborateur");
        }

        validateDates(request);

        Projet projet = Projet.builder()
                .nom(request.getNom())
                .description(request.getDescription())
                .dateDebut(request.getDateDebut())
                .dateFin(request.getDateFin())
                .role(request.getRole())
                .technologies(request.getTechnologies())
                .collaborateur(collaborateur)
                .build();

        return ProjetDTO.fromEntity(projetRepository.save(projet));
    }

    @Transactional
    public ProjetDTO updateProjet(Long collaborateurId, Long projetId, ProjetRequest request, Long requestingUserId) {
        Collaborateur collaborateur = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé"));

        if (!collaborateur.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier les projets de ce collaborateur");
        }

        if (!projetRepository.existsByIdAndCollaborateurId(projetId, collaborateurId)) {
            throw new ResourceNotFoundException("Projet non trouvé pour ce collaborateur");
        }

        validateDates(request);

        Projet projet = projetRepository.findById(projetId).orElseThrow();
        projet.setNom(request.getNom());
        projet.setDescription(request.getDescription());
        projet.setDateDebut(request.getDateDebut());
        projet.setDateFin(request.getDateFin());
        projet.setRole(request.getRole());
        projet.setTechnologies(request.getTechnologies());

        return ProjetDTO.fromEntity(projetRepository.save(projet));
    }

    @Transactional
    public void deleteProjet(Long collaborateurId, Long projetId, Long requestingUserId) {
        Collaborateur collaborateur = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé"));

        if (!collaborateur.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à supprimer les projets de ce collaborateur");
        }

        if (!projetRepository.existsByIdAndCollaborateurId(projetId, collaborateurId)) {
            throw new ResourceNotFoundException("Projet non trouvé pour ce collaborateur");
        }

        projetRepository.deleteById(projetId);
    }

    private void validateDates(ProjetRequest request) {
        if (request.getDateFin() != null && request.getDateFin().isBefore(request.getDateDebut())) {
            throw new ValidationException("La date de fin doit être après la date de début");
        }
    }
}
