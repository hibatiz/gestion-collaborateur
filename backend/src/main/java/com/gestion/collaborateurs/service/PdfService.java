package com.gestion.collaborateurs.service;

import com.gestion.collaborateurs.entity.Collaborateur;
import com.gestion.collaborateurs.entity.CollaborateurCompetence;
import com.gestion.collaborateurs.entity.Projet;
import com.gestion.collaborateurs.repository.CollaborateurCompetenceRepository;
import com.gestion.collaborateurs.repository.CollaborateurRepository;
import com.gestion.collaborateurs.repository.ProjetRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PdfService {

    private final CollaborateurRepository collaborateurRepository;
    private final CollaborateurCompetenceRepository collaborateurCompetenceRepository;
    private final ProjetRepository projetRepository;

    // Colors
    private static final Color NAVY = new Color(27, 42, 74);
    private static final Color BLUE = new Color(46, 124, 246);
    private static final Color DARK_TEXT = new Color(30, 30, 30);

    // Fonts
    private static final Font titleFont = new Font(Font.HELVETICA, 22, Font.BOLD, NAVY);
    private static final Font subtitleFont = new Font(Font.HELVETICA, 13, Font.NORMAL, BLUE);
    private static final Font sectionFont = new Font(Font.HELVETICA, 11, Font.BOLD, Color.WHITE);
    private static final Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL, DARK_TEXT);
    private static final Font smallFont = new Font(Font.HELVETICA, 9, Font.NORMAL, DARK_TEXT);
    private static final Font boldFont = new Font(Font.HELVETICA, 10, Font.BOLD, DARK_TEXT);
    private static final Font greyFont = new Font(Font.HELVETICA, 9, Font.NORMAL, Color.GRAY);
    private static final Font italicFont = new Font(Font.HELVETICA, 9, Font.ITALIC, DARK_TEXT);

    public byte[] generateCv(Long collaborateurId) {
        Collaborateur collab = collaborateurRepository.findById(collaborateurId)
                .orElseThrow(() -> new RuntimeException("Collaborateur non trouvé"));

        Document document = new Document(PageSize.A4, 50, 50, 50, 30);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, baos);
            document.open();

            // HEADER
            Paragraph namePara = new Paragraph(collab.getPrenom() + " " + collab.getNom(), titleFont);
            namePara.setAlignment(Element.ALIGN_CENTER);
            document.add(namePara);

            Paragraph postePara = new Paragraph(collab.getPoste(), subtitleFont);
            postePara.setAlignment(Element.ALIGN_CENTER);
            document.add(postePara);

            document.add(new Paragraph(" ", smallFont)); // Spacing

            String contactStr = collab.getEmail() + "  |  " + collab.getTelephone();
            Paragraph contactPara = new Paragraph(contactStr, smallFont);
            contactPara.setAlignment(Element.ALIGN_CENTER);
            document.add(contactPara);

            String infoStr = collab.getDepartement() + "  •  " + collab.getAnneesExperience() + " ans d'expérience";
            Paragraph infoPara = new Paragraph(infoStr, greyFont);
            infoPara.setAlignment(Element.ALIGN_CENTER);
            document.add(infoPara);

            document.add(new Paragraph(" ", smallFont));
            LineSeparator ls = new LineSeparator(2f, 100, BLUE, Element.ALIGN_CENTER, -2);
            document.add(ls);
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 15)));

            // COMPÉTENCES
            document.add(createSectionHeader("COMPÉTENCES"));
            document.add(new Paragraph(" ", smallFont));

            List<CollaborateurCompetence> comps = collaborateurCompetenceRepository.findByCollaborateurId(collaborateurId);
            Map<String, List<CollaborateurCompetence>> groupedComps = comps.stream()
                    .collect(Collectors.groupingBy(c -> c.getCompetence().getCategorie().name()));

            for (Map.Entry<String, List<CollaborateurCompetence>> entry : groupedComps.entrySet()) {
                document.add(new Paragraph(entry.getKey(), boldFont));
                
                for (CollaborateurCompetence cc : entry.getValue()) {
                    PdfPTable row = new PdfPTable(2);
                    row.setWidthPercentage(100);
                    row.setWidths(new float[]{70, 30});

                    PdfPCell cell1 = new PdfPCell(new Phrase(cc.getCompetence().getNom(), bodyFont));
                    cell1.setBorder(Rectangle.NO_BORDER);
                    row.addCell(cell1);

                    int score = switch (cc.getNiveau()) {
                        case DEBUTANT -> 1;
                        case INTERMEDIAIRE -> 2;
                        case AVANCE -> 3;
                        case EXPERT -> 4;
                    };
                    String dots = "●".repeat(score) + "○".repeat(4 - score);
                    PdfPCell cell2 = new PdfPCell(new Phrase(dots + " " + cc.getNiveau().name(), smallFont));
                    cell2.setBorder(Rectangle.NO_BORDER);
                    cell2.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    row.addCell(cell2);

                    document.add(row);
                }
                document.add(new Paragraph(" ", new Font(Font.HELVETICA, 5)));
            }
            document.add(new Paragraph(" ", new Font(Font.HELVETICA, 10)));

            // PROJETS
            document.add(createSectionHeader("PROJETS RÉALISÉS"));
            document.add(new Paragraph(" ", smallFont));

            List<Projet> projets = projetRepository.findByCollaborateurIdOrderByDateDebutDesc(collaborateurId);
            for (Projet p : projets) {
                PdfPTable headerRow = new PdfPTable(2);
                headerRow.setWidthPercentage(100);
                headerRow.setWidths(new float[]{70, 30});

                PdfPCell nameCell = new PdfPCell(new Phrase(p.getNom(), boldFont));
                nameCell.setBorder(Rectangle.NO_BORDER);
                headerRow.addCell(nameCell);

                long months = ChronoUnit.MONTHS.between(p.getDateDebut(), p.getDateFin() != null ? p.getDateFin() : LocalDate.now());
                String duration = months + " mois" + (p.getDateFin() == null ? " - En cours" : "");
                PdfPCell durCell = new PdfPCell(new Phrase(duration, greyFont));
                durCell.setBorder(Rectangle.NO_BORDER);
                durCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                headerRow.addCell(durCell);
                document.add(headerRow);

                if (p.getRole() != null && !p.getRole().isBlank()) {
                    document.add(new Paragraph("Rôle : " + p.getRole(), italicFont));
                }

                if (p.getDescription() != null && !p.getDescription().isBlank()) {
                    Paragraph desc = new Paragraph(p.getDescription(), bodyFont);
                    desc.setSpacingBefore(3f);
                    desc.setSpacingAfter(3f);
                    document.add(desc);
                }

                if (p.getTechnologies() != null && !p.getTechnologies().isBlank()) {
                    Paragraph techPara = new Paragraph("Technologies : " + p.getTechnologies().replace(",", "  "), smallFont);
                    document.add(techPara);
                }

                document.add(new LineSeparator(0.5f, 100, Color.LIGHT_GRAY, Element.ALIGN_CENTER, -2));
                document.add(new Paragraph(" ", new Font(Font.HELVETICA, 8)));
            }

            // FOOTER
            Paragraph footer = new Paragraph("Généré le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                    "  —  Plateforme Gestion des Collaborateurs", greyFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            footer.setSpacingBefore(20f);
            document.add(footer);

            document.close();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la génération du PDF", e);
        }

        return baos.toByteArray();
    }

    private PdfPTable createSectionHeader(String title) {
        PdfPTable table = new PdfPTable(1);
        table.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase(title, sectionFont));
        cell.setBackgroundColor(NAVY);
        cell.setPaddingTop(8f);
        cell.setPaddingBottom(8f);
        cell.setPaddingLeft(12f);
        cell.setBorder(Rectangle.NO_BORDER);
        table.addCell(cell);
        return table;
    }
}
