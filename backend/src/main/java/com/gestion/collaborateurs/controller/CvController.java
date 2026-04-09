package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.CvDTO;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.UserRepository;
import com.gestion.collaborateurs.service.CvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/cv")
@RequiredArgsConstructor
@Tag(name = "CV", description = "Endpoints pour la génération et l'export de CV au format PDF")
public class CvController {

    private final CvService cvService;
    private final UserRepository userRepository;
    private final CollaborateurRepository collaborateurRepository;

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByUsername(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping("/generate/{collaborateurId}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Générer et sauvegarder le CV d'un collaborateur au format PDF")
    public ResponseEntity<byte[]> generateCv(@PathVariable Long collaborateurId) {
        byte[] pdfBytes = cvService.generateAndSave(collaborateurId, getCurrentUserId());
        
        Collaborateur collab = collaborateurRepository.findById(collaborateurId).orElseThrow();
        String filename = "CV_" + collab.getNom() + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }

    @GetMapping("/history/{collaborateurId}")
    @PreAuthorize("hasAnyRole('COLLABORATEUR', 'MANAGER')")
    @Operation(summary = "Récupérer l'historique des CV générés pour un collaborateur")
    public ResponseEntity<List<CvDTO>> getHistory(@PathVariable Long collaborateurId) {
        return ResponseEntity.ok(cvService.getHistory(collaborateurId));
    }

    @DeleteMapping("/{cvId}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<Void> deleteCv(@PathVariable Long cvId) {
        cvService.deleteCv(cvId, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
