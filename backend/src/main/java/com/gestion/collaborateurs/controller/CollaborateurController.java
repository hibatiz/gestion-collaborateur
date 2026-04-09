package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.*;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.service.CollabDashboardService;
import com.gestion.collaborateurs.service.CollaborateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collaborateur")
@RequiredArgsConstructor
@Tag(name = "Collaborateur", description = "Endpoints pour la gestion des profils et compétences des collaborateurs")
public class CollaborateurController {

    private final CollaborateurService collaborateurService;
    private final CollabDashboardService collabDashboardService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Récupérer le profil du collaborateur connecté")
    public ResponseEntity<CollaborateurDTO> getCurrentCollaborateur(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(collaborateurService.getCollaborateurByUserId(user.getId()));
    }

    @GetMapping("/{id}/dashboard")
    @PreAuthorize("hasAnyRole('COLLABORATEUR','MANAGER')")
    @Operation(summary = "Récupérer les statistiques du dashboard pour un collaborateur")
    public ResponseEntity<CollabDashboardDTO> getDashboard(@PathVariable Long id) {
        return ResponseEntity.ok(collabDashboardService.getDashboard(id));
    }

    @GetMapping("/{id}/evolution")
    @PreAuthorize("hasAnyRole('COLLABORATEUR','MANAGER')")
    @Operation(summary = "Récupérer l'historique d'évolution des compétences")
    public ResponseEntity<List<EvolutionDTO>> getEvolution(@PathVariable Long id) {
        return ResponseEntity.ok(collabDashboardService.getEvolution(id));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un collaborateur par son ID")
    public ResponseEntity<CollaborateurDTO> getCollaborateurById(@PathVariable Long id) {
        return ResponseEntity.ok(collaborateurService.getCollaborateurById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Mettre à jour les informations du profil")
    public ResponseEntity<CollaborateurDTO> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(collaborateurService.updateProfile(id, request, user.getId()));
    }

    @PostMapping("/{id}/photo")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Uploader une photo de profil")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        String fileName = collaborateurService.uploadPhoto(id, file, user.getId());
        Map<String, String> response = new HashMap<>();
        response.put("photoUrl", fileName);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/competences")
    public ResponseEntity<List<CompetenceDTO>> getCompetences(@PathVariable Long id) {
        return ResponseEntity.ok(collaborateurService.getCompetences(id));
    }

    @PostMapping("/{id}/competences")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<CompetenceDTO> addCompetence(
            @PathVariable Long id,
            @RequestBody CompetenceRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(collaborateurService.addCompetence(id, request, user.getId()));
    }

    @PutMapping("/{id}/competences/{cid}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Mettre à jour le niveau d'une compétence")
    public ResponseEntity<CompetenceDTO> updateNiveau(
            @PathVariable Long id,
            @PathVariable Long cid,
            @RequestBody NiveauRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(collaborateurService.updateNiveau(id, cid, request, user.getId()));
    }

    @DeleteMapping("/{id}/competences/{cid}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<Void> deleteCompetence(
            @PathVariable Long id,
            @PathVariable Long cid,
            @AuthenticationPrincipal User user) {
        collaborateurService.deleteCompetence(id, cid, user.getId());
        return ResponseEntity.noContent().build();
    }
}
