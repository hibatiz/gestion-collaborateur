package com.gestion.collaborateurs.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnhancedDashboardDTO {
    // Base stats (from DashboardDTO)
    private long totalCollaborateurs;
    private long totalCompetences;
    private Map<String, Long> repartitionParDepartement;
    private List<Map<String, Object>> top5Competences;
    private Map<String, Long> repartitionNiveaux;
    private List<CollaborateurSummaryDTO> collaborateursRecents;

    // Enhanced stats
    private List<Map<String, Object>> evolutionMoyenneNiveaux;
    private Map<String, Map<String, Long>> repartitionParDepartementEtCategorie;
}
