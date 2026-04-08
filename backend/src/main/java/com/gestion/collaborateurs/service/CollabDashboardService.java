package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.*;
import com.gestion.collaborateurs.entity.*;
import com.gestion.collaborateurs.repository.*;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CollabDashboardService {

    private final CollaborateurRepository collaborateurRepository;
    private final ProjetRepository projetRepository;
    private final CompetenceLogRepository competenceLogRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;

    public CollabDashboardDTO getDashboard(Long collaborateurId) {
        Collaborateur coll = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new ResourceNotFoundException("Collaborateur non trouvé: " + collaborateurId));

        List<CollaborateurCompetence> competences = collaborateurCompetenceRepository.findByCollaborateurId(collaborateurId);
        List<Projet> projets = projetRepository.findByCollaborateurIdOrderByDateDebutDesc(collaborateurId);
        List<CompetenceLog> logs = competenceLogRepository.findByCollaborateurIdOrderByDateChangementAsc(collaborateurId);

        Map<String, Long> competencesParCategorie = competences.stream()
                .collect(groupingBy(cc -> cc.getCompetence().getCategorie().name(), counting()));

        Map<String, Long> niveauxDistribution = new HashMap<>();
        for (Niveau niveau : Niveau.values()) {
            niveauxDistribution.put(niveau.name(), 0L);
        }
        competences.forEach(cc -> {
            String n = cc.getNiveau().name();
            niveauxDistribution.put(n, niveauxDistribution.get(n) + 1);
        });

        List<ProjetDTO> projetsRecents = projets.stream()
                .limit(3)
                .map(this::mapProjetToDTO)
                .collect(Collectors.toList());

        List<EvolutionDTO> evolution = buildEvolution(logs);

        return CollabDashboardDTO.builder()
                .collaborateurId(coll.getId())
                .nom(coll.getNom())
                .prenom(coll.getPrenom())
                .poste(coll.getPoste())
                .departement(coll.getDepartement())
                .photoUrl(coll.getPhotoUrl())
                .anneesExperience(coll.getAnneesExperience())
                .email(coll.getEmail())
                .totalCompetences(competences.size())
                .totalProjets(projets.size())
                .competencesParCategorie(competencesParCategorie)
                .niveauxDistribution(niveauxDistribution)
                .projetsRecents(projetsRecents)
                .evolution(evolution)
                .build();
    }

    public List<EvolutionDTO> getEvolution(Long collaborateurId) {
        List<CompetenceLog> logs = competenceLogRepository.findByCollaborateurIdOrderByDateChangementAsc(collaborateurId);
        return buildEvolution(logs);
    }

    private List<EvolutionDTO> buildEvolution(List<CompetenceLog> logs) {
        Map<Long, List<CompetenceLog>> logsByComp = logs.stream()
                .collect(groupingBy(log -> log.getCompetence().getId()));

        return logsByComp.entrySet().stream().map(entry -> {
            List<CompetenceLog> compLogs = entry.getValue();
            Competence comp = compLogs.get(0).getCompetence();

            List<NiveauChangeDTO> historique = compLogs.stream().map(log -> NiveauChangeDTO.builder()
                    .id(log.getId())
                    .ancienNiveau(log.getAncienNiveau() != null ? log.getAncienNiveau().name() : null)
                    .nouveauNiveau(log.getNouveauNiveau().name())
                    .dateChangement(log.getDateChangement())
                    .description(log.getAncienNiveau() == null ?
                            "Ajout au niveau " + log.getNouveauNiveau().name() :
                            log.getAncienNiveau().name() + " → " + log.getNouveauNiveau().name())
                    .build()).collect(Collectors.toList());

            return EvolutionDTO.builder()
                    .competenceId(comp.getId())
                    .competenceNom(comp.getNom())
                    .categorie(comp.getCategorie().name())
                    .historique(historique)
                    .build();
        }).collect(Collectors.toList());
    }

    private ProjetDTO mapProjetToDTO(Projet p) {
        return ProjetDTO.builder()
                .id(p.getId())
                .nom(p.getNom())
                .description(p.getDescription())
                .dateDebut(p.getDateDebut())
                .dateFin(p.getDateFin())
                .role(p.getRole())
                .technologies(p.getTechnologies())
                .dureeEnMois(p.calculateDureeEnMois())
                .enCours(p.getDateFin() == null)
                .build();
    }
}
