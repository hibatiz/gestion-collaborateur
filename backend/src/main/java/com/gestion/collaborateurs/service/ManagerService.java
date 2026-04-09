package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.dto.*;
import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.Niveau;
import com.gestion.collaborateurs.exception.ResourceNotFoundException;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.CompetenceRepository;
import com.gestion.collaborateurs.entity.CollaborateurCompetence;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static java.util.stream.Collectors.counting;
import static java.util.stream.Collectors.groupingBy;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManagerService {

    private final CollaborateurRepository collaborateurRepository;
    private final CompetenceRepository competenceRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;

    public EnhancedDashboardDTO getEnhancedDashboard() {
        DashboardDTO base = getDashboard();

        // 1. evolutionMoyenneNiveaux
        List<CollaborateurCompetence> allCC = collaborateurCompetenceRepository.findAll();
        Map<String, List<CollaborateurCompetence>> groupedByComp = allCC.stream()
                .filter(cc -> cc.getCompetence() != null)
                .collect(groupingBy(cc -> cc.getCompetence().getNom()));

        List<Map<String, Object>> evolutionMoyenneNiveaux = groupedByComp.entrySet().stream()
                .map(entry -> {
                    double avg = entry.getValue().stream()
                            .mapToDouble(cc -> getNiveauScore(cc.getNiveau()))
                            .average().orElse(0.0);
                    Map<String, Object> map = new HashMap<>();
                    map.put("competence", entry.getKey());
                    map.put("moyenne", avg);
                    map.put("count", (long) entry.getValue().size());
                    return map;
                })
                .sorted((m1, m2) -> Double.compare((double) m2.get("moyenne"), (double) m1.get("moyenne")))
                .limit(10)
                .collect(Collectors.toList());

        // 2. repartitionParDepartementEtCategorie
        List<Collaborateur> allCollabs = collaborateurRepository.findAll();
        Map<String, Map<String, Long>> repartitionParDeptEtCat = allCollabs.stream()
                .filter(c -> c.getDepartement() != null)
                .collect(groupingBy(Collaborateur::getDepartement,
                        groupingBy(c -> "TOTAL", counting()))); // placeholder for nested grouping

        // Actually we need to loop through collabs and their competences
        Map<String, Map<String, Long>> result = new HashMap<>();
        for (Collaborateur c : allCollabs) {
            String dept = c.getDepartement();
            if (dept == null) continue;
            result.putIfAbsent(dept, new HashMap<>());
            for (CollaborateurCompetence cc : c.getCompetences()) {
                if (cc.getCompetence() != null && cc.getCompetence().getCategorie() != null) {
                    String cat = cc.getCompetence().getCategorie().name();
                    result.get(dept).put(cat, result.get(dept).getOrDefault(cat, 0L) + 1);
                }
            }
        }

        return EnhancedDashboardDTO.builder()
                .totalCollaborateurs(base.getTotalCollaborateurs())
                .totalCompetences(base.getTotalCompetences())
                .repartitionParDepartement(base.getRepartitionParDepartement())
                .top5Competences(base.getTop5Competences())
                .repartitionNiveaux(base.getRepartitionNiveaux())
                .collaborateursRecents(base.getCollaborateursRecents())
                .evolutionMoyenneNiveaux(evolutionMoyenneNiveaux)
                .repartitionParDepartementEtCategorie(result)
                .build();
    }

    private double getNiveauScore(Niveau n) {
        if (n == null) return 0.0;
        switch (n) {
            case DEBUTANT: return 1.0;
            case INTERMEDIAIRE: return 2.0;
            case AVANCE: return 3.0;
            case EXPERT: return 4.0;
            default: return 0.0;
        }
    }

    public MatriceDTO getMatrice() {
        List<Collaborateur> collabs =
                collaborateurRepository.findAllWithCompetencesAndProjets();

        // Build sorted list of all unique competence names
        List<String> allCompetences = collabs.stream()
                .flatMap(c -> c.getCompetences().stream())
                .filter(cc -> cc.getCompetence() != null)
                .map(cc -> cc.getCompetence().getNom())
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        // Build one CollabRowDTO per collaborateur
        List<CollabRowDTO> rows = collabs.stream().map(c -> {
            Map<String, String> niveaux = new LinkedHashMap<>();
            allCompetences.forEach(compName -> niveaux.put(compName, null));
            c.getCompetences().forEach(cc -> {
                if (cc.getCompetence() != null && cc.getNiveau() != null) {
                    niveaux.put(cc.getCompetence().getNom(), cc.getNiveau().name());
                }
            });
            return CollabRowDTO.builder()
                    .collaborateurId(c.getId())
                    .nom(c.getNom())
                    .prenom(c.getPrenom())
                    .poste(c.getPoste())
                    .photoUrl(c.getPhotoUrl())
                    .niveaux(niveaux)
                    .build();
        }).collect(Collectors.toList());

        return MatriceDTO.builder()
                .collaborateurs(rows)
                .competences(allCompetences)
                .build();
    }

    public byte[] exportMatricePdf(MatriceDTO matrice) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 20);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            Color NAVY = new Color(27, 42, 74);
            Color GREY = new Color(100, 116, 139);
            Color DEBUTANT_COLOR = new Color(203, 213, 225);
            Color INTER_COLOR = new Color(191, 219, 254);
            Color AVANCE_COLOR = new Color(254, 215, 170);
            Color EXPERT_COLOR = new Color(167, 243, 208);
            Color EMPTY_COLOR = new Color(248, 250, 252);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, NAVY);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, GREY);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9, NAVY);
            Font posteFont = FontFactory.getFont(FontFactory.HELVETICA, 7, GREY);
            Font badgeFont = FontFactory.getFont(FontFactory.HELVETICA, 8, NAVY);
            Font badgeFontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, NAVY);

            com.lowagie.text.Paragraph title = new com.lowagie.text.Paragraph("Matrice des Compétences", titleFont);
            title.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            document.add(title);

            com.lowagie.text.Paragraph subtitle = new com.lowagie.text.Paragraph(
                    matrice.getCollaborateurs().size() + " collaborateurs · " + matrice.getCompetences().size() + " compétences",
                    subtitleFont);
            subtitle.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(15f);
            document.add(subtitle);

            PdfPTable table = new PdfPTable(1 + matrice.getCompetences().size());
            table.setWidthPercentage(100);
            float[] widths = new float[1 + matrice.getCompetences().size()];
            widths[0] = 120f;
            for (int i = 1; i < widths.length; i++) widths[i] = 55f;
            table.setWidths(widths);

            // Header
            PdfPCell h1 = new PdfPCell(new com.lowagie.text.Phrase("Collaborateur / Poste", headerFont));
            h1.setBackgroundColor(NAVY);
            h1.setPadding(5);
            table.addCell(h1);

            for (String comp : matrice.getCompetences()) {
                String displayName = comp;
                if (comp.length() > 10) displayName = comp.substring(0, 8) + ".";
                PdfPCell hc = new PdfPCell(new com.lowagie.text.Phrase(displayName, headerFont));
                hc.setBackgroundColor(NAVY);
                hc.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                hc.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);
                table.addCell(hc);
            }

            // Rows
            for (CollabRowDTO row : matrice.getCollaborateurs()) {
                PdfPCell nameCell = new PdfPCell();
                nameCell.addElement(new com.lowagie.text.Phrase(row.getPrenom() + " " + row.getNom(), cellFont));
                nameCell.addElement(new com.lowagie.text.Phrase(row.getPoste(), posteFont));
                nameCell.setPadding(6f);
                table.addCell(nameCell);

                for (String compName : matrice.getCompetences()) {
                    String niveau = row.getNiveaux().get(compName);
                    PdfPCell cell = new PdfPCell();
                    cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
                    cell.setVerticalAlignment(com.lowagie.text.Element.ALIGN_MIDDLE);

                    if (niveau == null) {
                        cell.setBackgroundColor(EMPTY_COLOR);
                    } else {
                        String label = "";
                        Color color = EMPTY_COLOR;
                        Font f = badgeFont;
                        if (niveau.equals("DEBUTANT")) { label = "DEB"; color = DEBUTANT_COLOR; }
                        else if (niveau.equals("INTERMEDIAIRE")) { label = "INT"; color = INTER_COLOR; }
                        else if (niveau.equals("AVANCE")) { label = "AVA"; color = AVANCE_COLOR; }
                        else if (niveau.equals("EXPERT")) { label = "EXP"; color = EXPERT_COLOR; f = badgeFontBold; }

                        cell.setBackgroundColor(color);
                        cell.setPhrase(new com.lowagie.text.Phrase(label, f));
                    }
                    table.addCell(cell);
                }
            }
            document.add(table);

            // Legend
            PdfPTable legend = new PdfPTable(4);
            legend.setSpacingBefore(15f);
            legend.setWidthPercentage(60);
            legend.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_LEFT);

            addLegendCell(legend, "DÉBUTANT", DEBUTANT_COLOR);
            addLegendCell(legend, "INTERMÉDIAIRE", INTER_COLOR);
            addLegendCell(legend, "AVANCÉ", AVANCE_COLOR);
            addLegendCell(legend, "EXPERT", EXPERT_COLOR);
            document.add(legend);

            com.lowagie.text.Paragraph footer = new com.lowagie.text.Paragraph(
                    "Généré le " + LocalDate.now() + " — Plateforme Gestion Collaborateurs", subtitleFont);
            footer.setAlignment(com.lowagie.text.Element.ALIGN_CENTER);
            footer.setSpacingBefore(10f);
            document.add(footer);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            document.close();
        }
        return baos.toByteArray();
    }

    private void addLegendCell(PdfPTable table, String text, Color color) {
        PdfPCell cell = new PdfPCell(new com.lowagie.text.Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 8)));
        cell.setBackgroundColor(color);
        cell.setHorizontalAlignment(com.lowagie.text.Element.ALIGN_CENTER);
        cell.setPadding(4);
        table.addCell(cell);
    }

    public byte[] exportMatriceExcel(MatriceDTO matrice) {
        XSSFWorkbook workbook = new XSSFWorkbook();
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            XSSFSheet sheet = workbook.createSheet("Matrice Compétences");

            // Styles
            XSSFCellStyle headerStyle = createColorStyle(workbook, (byte) 27, (byte) 42, (byte) 74);
            XSSFFont headerFont = workbook.createFont();
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            XSSFCellStyle collabStyle = workbook.createCellStyle();
            collabStyle.setWrapText(true);
            collabStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            collabStyle.setBorderBottom(BorderStyle.THIN);
            collabStyle.setBorderRight(BorderStyle.THIN);

            XSSFCellStyle debutantStyle = createColorStyle(workbook, (byte) 203, (byte) 213, (byte) 225);
            XSSFCellStyle interStyle = createColorStyle(workbook, (byte) 191, (byte) 219, (byte) 254);
            XSSFCellStyle avanceStyle = createColorStyle(workbook, (byte) 254, (byte) 215, (byte) 170);
            XSSFCellStyle expertStyle = createColorStyle(workbook, (byte) 167, (byte) 243, (byte) 208);
            XSSFFont expertFont = workbook.createFont();
            expertFont.setBold(true);
            expertStyle.setFont(expertFont);

            XSSFCellStyle emptyStyle = createColorStyle(workbook, (byte) 248, (byte) 250, (byte) 252);

            // Header
            XSSFRow headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(60);
            XSSFCell hCell0 = headerRow.createCell(0);
            hCell0.setCellValue("Collaborateur");
            hCell0.setCellStyle(headerStyle);

            for (int i = 0; i < matrice.getCompetences().size(); i++) {
                XSSFCell cell = headerRow.createCell(i + 1);
                cell.setCellValue(matrice.getCompetences().get(i));
                cell.setCellStyle(headerStyle);
            }

            sheet.setColumnWidth(0, 6000);
            for (int i = 1; i <= matrice.getCompetences().size(); i++) {
                sheet.setColumnWidth(i, 3000);
            }

            // Data
            int rowIdx = 1;
            for (CollabRowDTO row : matrice.getCollaborateurs()) {
                XSSFRow xRow = sheet.createRow(rowIdx++);
                XSSFCell c0 = xRow.createCell(0);
                c0.setCellValue(row.getPrenom() + " " + row.getNom() + "\n" + row.getPoste());
                c0.setCellStyle(collabStyle);

                for (int i = 0; i < matrice.getCompetences().size(); i++) {
                    String compName = matrice.getCompetences().get(i);
                    String niveau = row.getNiveaux().get(compName);
                    XSSFCell cell = xRow.createCell(i + 1);

                    if (niveau == null) {
                        cell.setCellStyle(emptyStyle);
                    } else {
                        switch (niveau) {
                            case "DEBUTANT": cell.setCellStyle(debutantStyle); cell.setCellValue("DEB"); break;
                            case "INTERMEDIAIRE": cell.setCellStyle(interStyle); cell.setCellValue("INT"); break;
                            case "AVANCE": cell.setCellStyle(avanceStyle); cell.setCellValue("AVA"); break;
                            case "EXPERT": cell.setCellStyle(expertStyle); cell.setCellValue("EXP"); break;
                            default: cell.setCellStyle(emptyStyle);
                        }
                    }
                }
            }

            sheet.createFreezePane(1, 1);
            sheet.setAutoFilter(new CellRangeAddress(0, 0, 0, matrice.getCompetences().size()));

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            e.printStackTrace();
            return new byte[0];
        } finally {
            try { workbook.close(); } catch (Exception ignored) {}
        }
    }

    private XSSFCellStyle createColorStyle(XSSFWorkbook wb, byte r, byte g, byte b) {
        XSSFCellStyle style = wb.createCellStyle();
        XSSFColor color = new XSSFColor(new byte[]{r, g, b}, null);
        style.setFillForegroundColor(color);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    public EquipeDTO constituerEquipe(EquipeRequest request) {
        List<Collaborateur> membres =
                collaborateurRepository.findAllByIdWithCompetences(request.getCollaborateurIds());

        if (membres.isEmpty()) throw new ResourceNotFoundException("Aucun collaborateur trouvé");

        // Collect all competences covered by the team
        Set<String> covered = membres.stream()
                .flatMap(c -> c.getCompetences().stream())
                .map(cc -> cc.getCompetence().getNom().toLowerCase())
                .collect(Collectors.toSet());

        // Find missing competences
        List<String> manquantes = new ArrayList<>();
        if (request.getCompetencesRequises() != null) {
            manquantes = request.getCompetencesRequises().stream()
                    .filter(req -> !covered.contains(req.toLowerCase()))
                    .collect(Collectors.toList());
        }

        List<CollaborateurSummaryDTO> membresDTO = membres.stream()
                .map(CollaborateurSummaryDTO::fromEntity)
                .collect(Collectors.toList());

        List<String> couvertesDisplay = new ArrayList<>(covered);
        Collections.sort(couvertesDisplay);

        return EquipeDTO.builder()
                .projetNom(request.getProjetNom())
                .membres(membresDTO)
                .competencesCouvertes(couvertesDisplay)
                .competencesManquantes(manquantes)
                .hasGap(!manquantes.isEmpty())
                .build();
    }

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
            if (row[0] != null && row[1] != null) {
                repartitionNiveaux.put(row[0].toString(), ((Number) row[1]).longValue());
            }
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
