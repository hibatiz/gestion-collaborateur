package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.ProjetDTO;
import com.gestion.collaborateurs.dto.ProjetRequest;
import com.gestion.collaborateurs.repository.UserRepository;
import com.gestion.collaborateurs.service.ProjetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/collaborateur/{id}/projets")
@RequiredArgsConstructor
@Tag(name = "Project", description = "Endpoints pour la gestion des expériences professionnelles et projets")
public class ProjetController {

    private final ProjetService projetService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        UserDetails userDetails = (UserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findByUsername(userDetails.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('COLLABORATEUR', 'MANAGER')")
    @Operation(summary = "Récupérer la liste des projets d'un collaborateur")
    public ResponseEntity<List<ProjetDTO>> getProjets(@PathVariable Long id) {
        return ResponseEntity.ok(projetService.getProjets(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('COLLABORATEUR')")
    @Operation(summary = "Ajouter une nouvelle expérience projet")
    public ResponseEntity<ProjetDTO> addProjet(@PathVariable Long id, @Valid @RequestBody ProjetRequest request) {
        return new ResponseEntity<>(projetService.addProjet(id, request, getCurrentUserId()), HttpStatus.CREATED);
    }

    @PutMapping("/{pid}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<ProjetDTO> updateProjet(@PathVariable Long id, @PathVariable Long pid, @Valid @RequestBody ProjetRequest request) {
        return ResponseEntity.ok(projetService.updateProjet(id, pid, request, getCurrentUserId()));
    }

    @DeleteMapping("/{pid}")
    @PreAuthorize("hasRole('COLLABORATEUR')")
    public ResponseEntity<Void> deleteProjet(@PathVariable Long id, @PathVariable Long pid) {
        projetService.deleteProjet(id, pid, getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
