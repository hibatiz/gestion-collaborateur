package com.gestion.collaborateurs.controller;

import com.gestion.collaborateurs.dto.*;
import com.gestion.collaborateurs.service.CollaborateurService;
import com.gestion.collaborateurs.service.ManagerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
@PreAuthorize("hasRole('MANAGER')")
@Tag(name = "Manager", description = "Endpoints pour l'espace Manager (Dashboard, Matrice, Équipe)")
public class ManagerController {

    private final ManagerService managerService;
    private final CollaborateurService collaborateurService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<DashboardDTO> getDashboard() {
        return ResponseEntity.ok(managerService.getDashboard());
    }

    @GetMapping("/dashboard/enhanced")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Récupérer les statistiques avancées du dashboard manager")
    public ResponseEntity<EnhancedDashboardDTO> getEnhancedDashboard() {
        return ResponseEntity.ok(managerService.getEnhancedDashboard());
    }

    @GetMapping("/matrice")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Récupérer la matrice des compétences globale")
    public ResponseEntity<MatriceDTO> getMatrice() {
        return ResponseEntity.ok(managerService.getMatrice());
    }

    @GetMapping("/matrice/export")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Exporter la matrice des compétences (PDF ou Excel)")
    public ResponseEntity<byte[]> exportMatrice(@RequestParam(defaultValue = "pdf") String format) {
        MatriceDTO matrice = managerService.getMatrice();
        byte[] bytes;
        String filename;
        MediaType contentType;

        if ("xlsx".equalsIgnoreCase(format)) {
            bytes = managerService.exportMatriceExcel(matrice);
            filename = "matrice_competences.xlsx";
            contentType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            bytes = managerService.exportMatricePdf(matrice);
            filename = "matrice_competences.pdf";
            contentType = MediaType.APPLICATION_PDF;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(contentType)
                .body(bytes);
    }

    @PostMapping("/equipe")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Simuler la constitution d'une équipe projet et identifier les gaps")
    public ResponseEntity<EquipeDTO> constituerEquipe(@RequestBody @Valid EquipeRequest request) {
        return ResponseEntity.ok(managerService.constituerEquipe(request));
    }

    @GetMapping("/collaborateurs")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Récupérer la liste paginée de tous les collaborateurs")
    public ResponseEntity<PagedResponseDTO<CollaborateurSummaryDTO>> getAllCollaborateurs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(managerService.getAllCollaborateurs(page, size));
    }

    @GetMapping("/collaborateurs/search")
    @PreAuthorize("hasRole('MANAGER')")
    @Operation(summary = "Rechercher des collaborateurs par nom, compétence, niveau ou département")
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
    public ResponseEntity<CollaborateurDetailDTO> getCollaborateurDetail(@PathVariable Long id) {
        return ResponseEntity.ok(collaborateurService.getCollaborateurDetail(id));
    }

    @GetMapping("/departements")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<String>> getDepartements() {
        return ResponseEntity.ok(managerService.getDepartements());
    }
}
