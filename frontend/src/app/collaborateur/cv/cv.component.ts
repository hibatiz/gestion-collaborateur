import { Component, OnInit } from '@angular/core';
import { CollaborateurService } from '../collaborateur.service';
import { CvService } from '../cv.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CvMeta } from '../../shared/models/cv.model';
import { Collaborateur, Competence } from '../../shared/models/collaborateur.model';
import { Projet } from '../../shared/models/projet.model';

@Component({
  selector: 'app-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss']
})
export class CvComponent implements OnInit {

  // ── Collaborateur data ───────────────────────────────────────────────
  collaborateurId  = 1;
  collaborateur:   Collaborateur | null = null;
  competences:     Competence[] = [];
  projets:         Projet[] = [];
  cvHistory:       CvMeta[] = [];

  // ── UI state ─────────────────────────────────────────────────────────
  isLoading        = true;
  isGenerating     = false;
  isLoadingHistory = false;
  deleteConfirmId: number | null = null;
  errorMsg:        string | null = null;

  constructor(
    private collabService: CollaborateurService,
    private cvService:     CvService,
    private toastService:  ToastService
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadHistory();
  }

  // ── Data loading ─────────────────────────────────────────────────────
  loadAll(): void {
    this.isLoading = true;
    this.errorMsg  = null;

    this.collabService.getProfile(this.collaborateurId).subscribe({
      next: (data) => {
        this.collaborateur = data;
        // Competences may be embedded in the profile or fetched separately
        if (data.competences?.length) {
          this.competences = data.competences;
        } else {
          this.loadCompetences();
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMsg  = 'Impossible de charger le profil collaborateur.';
        this.isLoading = false;
      }
    });

    this.collabService.getProjets(this.collaborateurId).subscribe({
      next:  (data) => { this.projets = data; },
      error: ()     => {}
    });
  }

  private loadCompetences(): void {
    this.collabService.getCompetences(this.collaborateurId).subscribe({
      next:  (data) => { this.competences = data; },
      error: ()     => {}
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.cvService.getCvHistory(this.collaborateurId).subscribe({
      next:  (data) => { this.cvHistory = data; this.isLoadingHistory = false; },
      error: ()     => { this.isLoadingHistory = false; }
    });
  }

  // ── Computed helpers ─────────────────────────────────────────────────
  get fullName(): string {
    if (!this.collaborateur) return '';
    return `${this.collaborateur.prenom} ${this.collaborateur.nom}`.trim();
  }

  get initials(): string {
    const p = this.collaborateur?.prenom?.charAt(0) ?? '';
    const n = this.collaborateur?.nom?.charAt(0)    ?? '';
    return (p + n).toUpperCase() || 'CV';
  }

  competencesByCategorie(): Record<string, Competence[]> {
    return this.competences.reduce((acc, c) => {
      const cat = c.categorie || 'Autres';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {} as Record<string, Competence[]>);
  }

  // ────────────────────────────────────────────────────────────────────
  // sanitize() — Rend une chaîne 100% compatible Latin-1 / Helvetica
  //
  // jsPDF embarque Helvetica encodé Windows-1252 (Latin-1 étendu).
  // Tout caractère Unicode > U+00FF (symboles géométriques ●○, flèche →,
  // guillemets “”, espaces insécables…) est affiché comme '%' ou '?'.
  // Stratégie : table manuelle française + NFD normalization fallback.
  // ────────────────────────────────────────────────────────────────────
  private sanitize(str: string): string {
    if (!str) return '';
    // Substitutions manuelles : couvre l'intégralité du français + symboles courants
    const MAP: Record<string, string> = {
      'à':'a','â':'a','ä':'a','á':'a','ã':'a',
      'è':'e','é':'e','ê':'e','ë':'e',
      'î':'i','ï':'i','í':'i','ì':'i',
      'ô':'o','ö':'o','ó':'o','ò':'o','õ':'o',
      'ù':'u','û':'u','ü':'u','ú':'u',
      'ÿ':'y','ý':'y','ç':'c','ñ':'n',
      'À':'A','Â':'A','Ä':'A','Á':'A',
      'È':'E','É':'E','Ê':'E','Ë':'E',
      'Î':'I','Ï':'I','Í':'I',
      'Ô':'O','Ö':'O','Ó':'O',
      'Ù':'U','Û':'U','Ü':'U','Ú':'U',
      'Ç':'C','Ñ':'N',
      '\u0153':'oe','\u0152':'OE',
      '\u00e6':'ae','\u00c6':'AE',
      '\u2019':"'",'\u2018':"'",
      '\u201c':'"','\u201d':'"',
      '\u2013':'-','\u2014':'-',
      '\u2026':'...','\u00b7':'.',
      '\u2192':'>',
      '\u25cf':'*','\u25cb':'o','\u2022':'-',
      '\u00a0':' '
    };
    let result = '';
    for (const ch of str) { result += MAP[ch] ?? ch; }
    // NFD fallback : décompose les diacritiques résiduels puis les supprime
    return result
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x00-\xFF]/g, '?');
  }

  // ────────────────────────────────────────────────────────────────────
  // downloadCV() — Option A : jsPDF natif uniquement
  //
  // Aucune dépendance à html2canvas.
  // Le PDF est généré entièrement avec doc.text() / doc.line() / doc.rect().
  // Zéro risque de "wrong PNG signature" ou d'erreur de scaling DOM.
  // ────────────────────────────────────────────────────────────────────
  async downloadCV(): Promise<void> {
    if (!this.collaborateur) {
      this.toastService.show('Données collaborateur non chargées', 'error');
      return;
    }

    this.isGenerating = true;
    this.toastService.show('Génération du PDF en cours…', 'info');

    try {
      const { jsPDF } = await import('jspdf');

      const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const c    = this.collaborateur;
      const PW   = 210;   // page width  mm
      const PH   = 297;   // page height mm
      const ML   = 20;    // margin left
      const MR   = 20;    // margin right
      const CW   = PW - ML - MR;  // content width
      let   y    = 0;     // current Y cursor

      // ── Couleurs ──────────────────────────────────────────────────────
      const NAVY   : [number, number, number] = [15,  23,  42];
      const BLUE   : [number, number, number] = [37,  99, 235];
      const DARK   : [number, number, number] = [30,  30,  30];
      const MUTED  : [number, number, number] = [100, 116, 139];
      const WHITE  : [number, number, number] = [255, 255, 255];
      const LIGHT  : [number, number, number] = [241, 245, 249];
      const DIVIDER: [number, number, number] = [203, 213, 225];

      // ── Helper : setColor shorthand ───────────────────────────────────
      const fill  = (rgb: [number,number,number]) => doc.setFillColor(...rgb);
      const text  = (rgb: [number,number,number]) => doc.setTextColor(...rgb);
      const draw  = (rgb: [number,number,number]) => doc.setDrawColor(...rgb);

      // ── Helper : section header bar — label toujours sanitize() + uppercase
      const sectionBar = (label: string): void => {
        y += 6;
        fill(NAVY);
        doc.rect(ML, y, CW, 8, 'F');
        text(WHITE);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(this.sanitize(label).toUpperCase(), ML + 4, y + 5.5);
        y += 12;
      };

      // ── Helper : safe addPage when near bottom ────────────────────────
      const checkPage = (needed = 12): void => {
        if (y + needed > PH - 15) {
          doc.addPage();
          y = 20;
        }
      };

      // Alias court — évite d'écrire this.sanitize() partout
      const san = (v: string | null | undefined) => this.sanitize(v ?? '');

      // ══════════════════════════════════════════════════════════════════
      // HEADER — fond bleu marine pleine largeur
      // ══════════════════════════════════════════════════════════════════
      fill(NAVY);
      doc.rect(0, 0, PW, 52, 'F');

      // Cercle initiales
      fill(BLUE);
      doc.circle(ML + 12, 26, 12, 'F');
      text(WHITE);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text(san(this.initials), ML + 12, 30, { align: 'center' });

      // Nom + poste
      const TX = ML + 30;
      text(WHITE);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(san(this.fullName), TX, 20);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(san(c.poste), TX, 29);

      // Ligne de contact — separateur '|' ASCII pur
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      const contact = [
        c.email,
        c.telephone,
        c.departement,
        `${c.anneesExperience} an${c.anneesExperience > 1 ? 's' : ''} d'experience`
      ].filter(Boolean).map(v => san(v)).join('  |  ');
      doc.text(contact, TX, 40, { maxWidth: CW - 30 });

      y = 60;

      // ══════════════════════════════════════════════════════════════════
      // COMPETENCES
      // ══════════════════════════════════════════════════════════════════
      if (this.competences.length > 0) {
        sectionBar('Competences');

        const grouped = this.competencesByCategorie();

        // Niveaux en ASCII pur : barres '[I]' à '[IIII]' — aucun Unicode
        const niveauLabel: Record<string, string> = {
          DEBUTANT:      'Debutant',
          INTERMEDIAIRE: 'Intermediaire',
          AVANCE:        'Avance',
          EXPERT:        'Expert'
        };
        const niveauBar: Record<string, string> = {
          DEBUTANT:      '[I   ]',
          INTERMEDIAIRE: '[II  ]',
          AVANCE:        '[III ]',
          EXPERT:        '[IIII]'
        };

        for (const [cat, skills] of Object.entries(grouped)) {
          checkPage(8);
          text(BLUE);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          // Alignement gauche strict : ML (pas ML+4)
          doc.text(san(cat), ML, y);
          y += 5;

          const colW = CW / 2;
          skills.forEach((sk, i) => {
            const col  = i % 2;
            const xPos = ML + col * colW;
            if (col === 0) checkPage(6);

            // Nom — aligné gauche de la colonne
            text(DARK);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(san(sk.nom), xPos, y);

            // Barre niveau — alignée droite de la colonne
            text(MUTED);
            const bar   = niveauBar[sk.niveau]   ?? '[?   ]';
            const label = niveauLabel[sk.niveau] ?? san(sk.niveau);
            doc.text(`${bar} ${label}`, xPos + colW - 2, y, { align: 'right' });

            if (col === 1 || i === skills.length - 1) y += 5.5;
          });
          y += 3;
        }
      }

      // ══════════════════════════════════════════════════════════════════
      // EXPERIENCES & PROJETS
      // ══════════════════════════════════════════════════════════════════
      if (this.projets.length > 0) {
        checkPage(20);
        sectionBar('Experiences & Projets');

        this.projets.forEach((p, idx) => {
          checkPage(26);

          // Dot timeline
          fill(BLUE);
          doc.circle(ML + 3, y + 2, 2.5, 'F');

          if (idx < this.projets.length - 1) {
            draw(DIVIDER);
            doc.setLineWidth(0.3);
            doc.line(ML + 3, y + 4.5, ML + 3, y + 26);
          }

          const TX2 = ML + 10;

          // Titre
          text(DARK);
          doc.setFontSize(10.5);
          doc.setFont('helvetica', 'bold');
          doc.text(san(p.nom), TX2, y + 3);

          // Periode — '>' a la place de la fleche Unicode
          const debut  = p.dateDebut ? p.dateDebut.substring(0, 7) : '';
          const fin    = p.enCours ? "Aujourd'hui" : (p.dateFin ? p.dateFin.substring(0, 7) : '');
          const period = debut ? `${debut} > ${san(fin)}` : '';
          text(MUTED);
          doc.setFontSize(8.5);
          doc.setFont('helvetica', 'normal');
          if (period) doc.text(period, PW - MR, y + 3, { align: 'right' });

          // Role
          if (p.role) {
            text(BLUE);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(san(p.role), TX2, y + 8.5);
          }

          // Description (retour a la ligne automatique, max 3 lignes)
          if (p.description) {
            text(DARK);
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'normal');
            const descLines = doc.splitTextToSize(san(p.description), CW - 12);
            doc.text(descLines.slice(0, 3), TX2, y + 14);
          }

          // Technologies
          if (p.technologies) {
            text(MUTED);
            doc.setFontSize(8);
            doc.text(`Tech: ${san(p.technologies)}`, TX2, y + 23, { maxWidth: CW - 12 });
          }

          // Separateur
          draw(DIVIDER);
          doc.setLineWidth(0.2);
          doc.line(TX2, y + 26.5, PW - MR, y + 26.5);

          y += 30;
        });
      }

      // ══════════════════════════════════════════════════════════════════
      // FOOTER — numéro de page + date de génération
      // ══════════════════════════════════════════════════════════════════
      const totalPages = (doc as any).internal.pages.length - 1;
      for (let pg = 1; pg <= totalPages; pg++) {
        doc.setPage(pg);
        fill(NAVY);
        doc.rect(0, PH - 12, PW, 12, 'F');
        text(MUTED);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        const today = new Date().toLocaleDateString('fr-FR');
        doc.text(`Généré le ${today}  —  Gestion des Collaborateurs`, ML, PH - 5);
        doc.text(`${pg} / ${totalPages}`, PW - MR, PH - 5, { align: 'right' });
      }

      // ── Save ──────────────────────────────────────────────────────────
      const fname = `CV_${c.nom}_${c.prenom}.pdf`.replace(/\s+/g, '_');
      doc.save(fname);

      this.toastService.show('✅ CV téléchargé avec succès !', 'success');
      this.loadHistory();

    } catch (err: any) {
      console.error('[CV Export]', err);
      this.toastService.show(
        err?.message ? `Erreur : ${err.message}` : 'Erreur génération PDF',
        'error'
      );
    } finally {
      this.isGenerating = false;
    }
  }

  // ── History CRUD ─────────────────────────────────────────────────────
  confirmDeleteCv(id: number): void { this.deleteConfirmId = id; }

  executeDeleteCv(id: number): void {
    this.cvService.deleteCv(id).subscribe({
      next: () => {
        this.toastService.show("CV supprimé de l'historique", 'success');
        this.loadHistory();
        this.deleteConfirmId = null;
      },
      error: () => this.toastService.show('Erreur lors de la suppression', 'error')
    });
  }
}
