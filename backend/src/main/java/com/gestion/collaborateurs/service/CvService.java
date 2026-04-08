package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.CvDTO;
import com.gestion.collaborateurs.entity.CV;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.exception.UnauthorizedException;
import com.gestion.collaborateurs.repository.CvRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CvService {

    private final CvRepository cvRepository;
    private final CollaborateurRepository collaborateurRepository;
    private final PdfService pdfService;

    private static final String UPLOAD_DIR = "./uploads/cvs";

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage", e);
        }
    }

    @Transactional
    public byte[] generateAndSave(Long collaborateurId, Long requestingUserId) {
        Collaborateur collaborateur = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé"));

        if (!collaborateur.getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à générer le CV de ce collaborateur");
        }

        byte[] pdfBytes = pdfService.generateCv(collaborateurId);

        int version = cvRepository.countByCollaborateurId(collaborateurId) + 1;
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        
        // Normalize filename: clean name, replace spaces with underscores
        String cleanNom = normalize(collaborateur.getNom());
        String cleanPrenom = normalize(collaborateur.getPrenom());
        String nomFichier = "CV_" + cleanNom + "_" + cleanPrenom + "_v" + version + "_" + timestamp + ".pdf";

        try {
            Files.write(Paths.get(UPLOAD_DIR, nomFichier), pdfBytes);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de l'enregistrement du fichier CV", e);
        }

        CV cv = CV.builder()
                .collaborateur(collaborateur)
                .version(version)
                .nomFichier(nomFichier)
                .format("PDF")
                .templateUtilise("default")
                .dateGeneration(LocalDateTime.now())
                .build();

        cvRepository.save(cv);

        return pdfBytes;
    }

    public List<CvDTO> getHistory(Long collaborateurId) {
        if (!collaborateurRepository.existsById(collaborateurId)) {
            throw new ResourceNotFoundException("Collaborateur non trouvé");
        }
        return cvRepository.findByCollaborateurIdOrderByDateGenerationDesc(collaborateurId)
                .stream()
                .map(CvDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteCv(Long cvId, Long requestingUserId) {
        CV cv = cvRepository.findById(cvId)
                .orElseThrow(() -> new ResourceNotFoundException("CV non trouvé"));

        if (!cv.getCollaborateur().getUser().getId().equals(requestingUserId)) {
            throw new UnauthorizedException("Vous n'êtes pas autorisé à supprimer ce CV");
        }

        try {
            Files.deleteIfExists(Paths.get(UPLOAD_DIR, cv.getNomFichier()));
        } catch (IOException e) {
            // Ignore if file is missing
        }

        cvRepository.deleteById(cvId);
    }

    private String normalize(String input) {
        if (input == null) return "Unknown";
        return input.toLowerCase()
                .replace(" ", "_")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[àâä]", "a")
                .replaceAll("[îï]", "i")
                .replaceAll("[ôö]", "o")
                .replaceAll("[ûü]", "u")
                .replaceAll("[ç]", "c")
                .replaceAll("[^a-z0-9_]", "");
    }
}
