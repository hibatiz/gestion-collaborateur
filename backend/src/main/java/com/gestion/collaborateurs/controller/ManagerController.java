package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.CollaborateurDTO;
import com.gestion.collaborateurs.dto.CollaborateurSummaryDTO;
import com.gestion.collaborateurs.dto.DashboardDTO;
import com.gestion.collaborateurs.dto.PagedResponseDTO;
import com.gestion.collaborateurs.dto.SearchParamsDTO;
import com.gestion.collaborateurs.service.CollaborateurService;
import com.gestion.collaborateurs.service.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
public class ManagerController {

    private final ManagerService managerService;
    private final CollaborateurService collaborateurService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(managerService.getDashboard());
    }

    @GetMapping("/collaborateurs")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PagedResponseDTO<CollaborateurSummaryDTO>> getAllCollaborateurs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(managerService.getAllCollaborateurs(page, size));
    }

    @GetMapping("/collaborateurs/search")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<PagedResponseDTO<CollaborateurSummaryDTO>> searchCollaborateurs(
            @RequestParam(required = false) String nom,
            @RequestParam(required = false) String competence,
            @RequestParam(required = false) String niveau,
            @RequestParam(required = false) String departement,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        SearchParamsDTO params = new SearchParamsDTO(nom, competence, niveau, departement);
        return ResponseEntity.ok(managerService.searchCollaborateurs(params, page, size));
    }

    @GetMapping("/collaborateurs/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<CollaborateurDTO> getCollaborateurDetail(@PathVariable Long id) {
        return ResponseEntity.ok(collaborateurService.getCollaborateurById(id));
    }

    @GetMapping("/departements")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<String>> getDepartements() {
        return ResponseEntity.ok(managerService.getDepartements());
    }
}
