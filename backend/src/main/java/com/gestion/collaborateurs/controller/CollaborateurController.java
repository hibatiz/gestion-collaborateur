package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.CollaborateurDTO;
import com.gestion.collaborateurs.dto.CompetenceDTO;
import com.gestion.collaborateurs.dto.CompetenceRequest;
import com.gestion.collaborateurs.dto.NiveauRequest;
import com.gestion.collaborateurs.dto.UpdateProfileRequest;
import com.gestion.collaborateurs.entity.User;
import com.gestion.collaborateurs.service.CollaborateurService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collaborateur")
@RequiredArgsConstructor
public class CollaborateurController {

    private final CollaborateurService collaborateurService;

    @GetMapping("/{id}")
    public ResponseEntity<CollaborateurDTO> getCollaborateurById(@PathVariable Long id) {
        return ResponseEntity.ok(collaborateurService.getCollaborateurById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<CollaborateurDTO> updateProfile(
            @PathVariable Long id,
            @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(collaborateurService.updateProfile(id, request, user.getId()));
    }

    @PostMapping("/{id}/photo")
    @PreAuthorize("hasRole('COLLABORATEUR')")
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
