package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.CollaborateurDTO;
import com.gestion.collaborateurs.dto.CompetenceDTO;
import com.gestion.collaborateurs.dto.CompetenceRequest;
import com.gestion.collaborateurs.dto.NiveauRequest;
import com.gestion.collaborateurs.dto.UpdateProfileRequest;
import com.gestion.collaborateurs.entity.Categorie;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.CollaborateurCompetence;
import com.gestion.collaborateurs.entity.Competence;
import com.gestion.collaborateurs.entity.Niveau;
import com.gestion.collaborateurs.exception.ConflictException;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.exception.UnauthorizedException;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.CompetenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollaborateurService {

    private final CollaborateurRepository collaborateurRepository;
    private final CompetenceRepository competenceRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;
    private final FileStorageService fileStorageService;

    public CollaborateurDTO getCollaborateurByUserId(Long userId) {
        Collaborateur coll = collaborateurRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé pour l'utilisateur: " + userId));
        return mapToDTO(coll);
    }

    public CollaborateurDTO getCollaborateurById(Long id) {
        Collaborateur coll = collaborateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + id));
        return mapToDTO(coll);
    }

    @Transactional
    public CollaborateurDTO updateProfile(Long id, UpdateProfileRequest request, Long requestingUserId) {
        Collaborateur coll = collaborateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + id));

        if (!coll.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier ce profil.");
        }

        if (request.getNom() == null || request.getNom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom ne peut pas être vide");
        }
        if (request.getPrenom() == null || request.getPrenom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le prénom ne peut pas être vide");
        }

        coll.setNom(request.getNom());
        coll.setPrenom(request.getPrenom());
        coll.setPoste(request.getPoste());
        coll.setDepartement(request.getDepartement());
        coll.setAnneesExperience(request.getAnneesExperience());
        coll.setEmail(request.getEmail());
        coll.setTelephone(request.getTelephone());

        collaborateurRepository.save(coll);
        return mapToDTO(coll);
    }

    @Transactional
    public String uploadPhoto(Long id, MultipartFile file, Long requestingUserId) {
        Collaborateur coll = collaborateurRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + id));

        if (!coll.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier ce profil.");
        }

        String fileName = fileStorageService.storeFile(file);
        // Create full URL or just return name (frontend will append /uploads/)
        coll.setPhotoUrl(fileName);
        collaborateurRepository.save(coll);
        return fileName;
    }

    public List<CompetenceDTO> getCompetences(Long collaborateurId) {
        List<CollaborateurCompetence> ccList = collaborateurCompetenceRepository.findByCollaborateurId(collaborateurId);
        return ccList.stream().map(this::mapCompetenceToDTO).collect(Collectors.toList());
    }

    @Transactional
    public CompetenceDTO addCompetence(Long collaborateurId, CompetenceRequest request, Long requestingUserId) {
        Collaborateur coll = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + collaborateurId));

        if (!coll.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier ce profil.");
        }

        Competence competence = competenceRepository.findByNomIgnoreCase(request.getNom())
                .orElseGet(() -> {
                    Competence newComp = Competence.builder()
                            .nom(request.getNom())
                            .categorie(Categorie.valueOf(request.getCategorie()))
                            .build();
                    return competenceRepository.save(newComp);
                });

        collaborateurCompetenceRepository.findByCollaborateurIdAndCompetenceId(collaborateurId, competence.getId())
                .ifPresent(cc -> {
                    throw new ConflictException("Cette compétence existe déjà pour ce collaborateur");
                });

        CollaborateurCompetence cc = CollaborateurCompetence.builder()
                .collaborateur(coll)
                .competence(competence)
                .niveau(Niveau.valueOf(request.getNiveau()))
                .dateAcquisition(request.getDateAcquisition() != null ? request.getDateAcquisition() : LocalDate.now())
                .build();

        collaborateurCompetenceRepository.save(cc);
        return mapCompetenceToDTO(cc);
    }

    @Transactional
    public CompetenceDTO updateNiveau(Long collaborateurId, Long competenceId, NiveauRequest request, Long requestingUserId) {
        Collaborateur coll = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + collaborateurId));

        if (!coll.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier ce profil.");
        }

        CollaborateurCompetence cc = collaborateurCompetenceRepository.findByCollaborateurIdAndCompetenceId(collaborateurId, competenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Compétence non trouvée pour ce collaborateur"));

        cc.setNiveau(Niveau.valueOf(request.getNiveau()));
        collaborateurCompetenceRepository.save(cc);
        return mapCompetenceToDTO(cc);
    }

    @Transactional
    public void deleteCompetence(Long collaborateurId, Long competenceId, Long requestingUserId) {
        Collaborateur coll = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + collaborateurId));

        if (!coll.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à modifier ce profil.");
        }

        CollaborateurCompetence cc = collaborateurCompetenceRepository.findByCollaborateurIdAndCompetenceId(collaborateurId, competenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Compétence non trouvée pour ce collaborateur"));

        collaborateurCompetenceRepository.delete(cc);
    }

    private CollaborateurDTO mapToDTO(Collaborateur coll) {
        List<CompetenceDTO> competences = coll.getCompetences().stream()
                .map(this::mapCompetenceToDTO)
                .collect(Collectors.toList());

        return CollaborateurDTO.builder()
                .id(coll.getId())
                .nom(coll.getNom())
                .prenom(coll.getPrenom())
                .poste(coll.getPoste())
                .departement(coll.getDepartement())
                .anneesExperience(coll.getAnneesExperience())
                .email(coll.getEmail())
                .telephone(coll.getTelephone())
                .photoUrl(coll.getPhotoUrl())
                .competences(competences)
                .build();
    }

    private CompetenceDTO mapCompetenceToDTO(CollaborateurCompetence cc) {
        return CompetenceDTO.builder()
                .id(cc.getCompetence().getId())
                .nom(cc.getCompetence().getNom())
                .categorie(cc.getCompetence().getCategorie().name())
                .niveau(cc.getNiveau().name())
                .dateAcquisition(cc.getDateAcquisition())
                .build();
    }
}
