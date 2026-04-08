package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.*;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.Niveau;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.CompetenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManagerService {

    private final CollaborateurRepository collaborateurRepository;
    private final CompetenceRepository competenceRepository;

    public DashboardDTO getDashboard() {
        long totalCollabs = collaborateurRepository.count();
        long totalComps = competenceRepository.count();

        // Department distribution
        Map<String, Long> repartitionDept = collaborateurRepository.findAll().stream()
            .filter(c -> c.getDepartement() != null)
            .collect(groupingBy(Collaborateur::getDepartement, counting()));

        // Top 5 competences
        List<Map<String, Object>> top5Comps = competenceRepository.findTop5Competences(PageRequest.of(0, 5))
            .stream()
            .map(row -> {
                Map<String, Object> map = new HashMap<>();
                map.put("nom", row[0]);
                map.put("count", row[1]);
                return map;
            })
            .collect(Collectors.toList());

        // Level distribution
        Map<String, Long> repartitionNiveaux = new HashMap<>();
        for (Niveau niveau : Niveau.values()) {
            repartitionNiveaux.put(niveau.name(), 0L);
        }
        competenceRepository.countByNiveau().forEach(row -> {
            repartitionNiveaux.put(row[0].toString(), (Long) row[1]);
        });

        // Recent collaborators
        List<CollaborateurSummaryDTO> recents = collaborateurRepository.findAll(
            PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "id")))
            .map(CollaborateurSummaryDTO::fromEntity)
            .getContent();

        return DashboardDTO.builder()
            .totalCollaborateurs(totalCollabs)
            .totalCompetences(totalComps)
            .repartitionParDepartement(repartitionDept)
            .top5Competences(top5Comps)
            .repartitionNiveaux(repartitionNiveaux)
            .collaborateursRecents(recents)
            .build();
    }

    public PagedResponseDTO<CollaborateurSummaryDTO> getAllCollaborateurs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("nom").ascending());
        Page<Collaborateur> result = collaborateurRepository.findAll(pageable);
        return mapToPagedResponse(result);
    }

    public PagedResponseDTO<CollaborateurSummaryDTO> searchCollaborateurs(SearchParamsDTO params, int page, int size) {
        if (isParamsEmpty(params)) {
            return getAllCollaborateurs(page, size);
        }

        Niveau niveauEnum = null;
        if (params.getNiveau() != null && !params.getNiveau().isEmpty()) {
            try {
                niveauEnum = Niveau.valueOf(params.getNiveau().toUpperCase());
            } catch (IllegalArgumentException e) {
                niveauEnum = null;
            }
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("nom").ascending());
        Page<Collaborateur> result = collaborateurRepository.searchCollaborateurs(
            params.getNom(),
            params.getCompetence(),
            niveauEnum,
            params.getDepartement(),
            pageable
        );

        return mapToPagedResponse(result);
    }

    public List<String> getDepartements() {
        return competenceRepository.findAllDepartements();
    }

    private boolean isParamsEmpty(SearchParamsDTO params) {
        return (params.getNom() == null || params.getNom().isEmpty()) &&
               (params.getCompetence() == null || params.getCompetence().isEmpty()) &&
               (params.getNiveau() == null || params.getNiveau().isEmpty()) &&
               (params.getDepartement() == null || params.getDepartement().isEmpty());
    }

    private PagedResponseDTO<CollaborateurSummaryDTO> mapToPagedResponse(Page<Collaborateur> page) {
        List<CollaborateurSummaryDTO> content = page.getContent().stream()
            .map(CollaborateurSummaryDTO::fromEntity)
            .collect(Collectors.toList());

        return new PagedResponseDTO<>(
            content,
            page.getNumber(),
            page.getTotalPages(),
            page.getTotalElements(),
            page.getSize(),
            page.hasNext(),
            page.hasPrevious()
        );
    }
}
