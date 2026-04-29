import {
  Component, OnInit, ElementRef, ViewChild
} from '@angular/core';
import { CollaborateurService } from '../collaborateur.service';
import { CvService } from '../cv.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CvMeta } from '../../shared/models/cv.model';
import { Collaborateur, Competence } from '../../shared/models/collaborateur.model';
import { Projet } from '../../shared/models/projet.model';

// Lazy-loaded to keep initial bundle small
declare const html2canvas: any;

// ─── Skill data for CV gauge display ─────────────────────────────────
interface CvSkill {
  nom:      string;
  niveau:   string;
  pct:      number;   // 0-100
  categorie: string;
}

// ─── Hackathon palmarès (static branding content) ────────────────────
interface Palmares {
  title:  string;
  event:  string;
  date:   string;
  emoji:  string;
  color:  string;
}

@Component({
  selector: 'app-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss']
})
export class CvComponent implements OnInit {

  @ViewChild('cvTemplate') cvTemplate!: ElementRef<HTMLDivElement>;

  collaborateurId   = 1;
  collaborateur:    Collaborateur | null = null;
  competences:      Competence[] = [];
  projets:          Projet[] = [];
  cvSkills:         CvSkill[] = [];
  cvHistory:        CvMeta[] = [];

  competencesCount  = 0;
  projetsCount      = 0;

  isGenerating      = false;
  isLoadingHistory  = false;
  deleteConfirmId:  number | null = null;

  // ── Photo URL resolved for html2canvas (must be same-origin or data URL)
  resolvedPhotoUrl: string = '';

  // ── Static palmarès data ────────────────────────────────────────────
  readonly palmares: Palmares[] = [
    {
      title: '1er Prix — Hackathon Sécurité',
      event: 'CyberChallenge 2024 · Université de Lyon',
      date:  'Novembre 2024',
      emoji: '🏆',
      color: '#fbbf24'
    },
    {
      title: '2e Prix — Hackathon IA & Data',
      event: 'DataHack 2025 · Paris La Défense',
      date:  'Mars 2025',
      emoji: '🥈',
      color: '#94a3b8'
    }
  ];

  // ── Static formation data ────────────────────────────────────────────
  readonly formations = [
    {
      diplome: 'Bachelor Cybersécurité',
      etablissement: 'EPITA · Paris',
      annee: '2022 – 2025',
      mention: 'Mention Très Bien'
    },
    {
      diplome: 'BTS SIO option SLAM',
      etablissement: 'Lycée Louis Armand · Lyon',
      annee: '2020 – 2022',
      mention: ''
    }
  ];

  constructor(
    private collabService: CollaborateurService,
    private cvService: CvService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadHistory();
  }

  // ── Data loading ────────────────────────────────────────────────────
  loadData(): void {
    this.collabService.getProfile(this.collaborateurId).subscribe({
      next: (data) => {
        this.collaborateur = data;
        this.resolvePhoto(data.photoUrl);
      },
      error: () => this.toastService.show('Erreur de chargement du profil', 'error')
    });

    this.collabService.getCompetences(this.collaborateurId).subscribe({
      next: (data) => {
        this.competences      = data;
        this.competencesCount = data.length;
        this.cvSkills         = this.buildCvSkills(data);
      },
      error: () => {}
    });

    this.collabService.getProjets(this.collaborateurId).subscribe({
      next: (data: Projet[]) => {
        this.projets      = data;
        this.projetsCount = data.length;
      },
      error: () => {}
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.cvService.getCvHistory(this.collaborateurId).subscribe({
      next: (data) => { this.cvHistory = data; this.isLoadingHistory = false; },
      error: () => { this.isLoadingHistory = false; }
    });
  }

  // ── Photo: convert to data URL so html2canvas can render it ─────────
  private resolvePhoto(photoUrl: string | null): void {
    if (!photoUrl) { this.resolvedPhotoUrl = ''; return; }

    const src = photoUrl.startsWith('http')
      ? photoUrl
      : `/api/uploads/${photoUrl}`;

    // Fetch as blob → data URL to avoid CORS issues in canvas
    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e: any) => { this.resolvedPhotoUrl = e.target.result; };
        reader.readAsDataURL(blob);
      })
      .catch(() => { this.resolvedPhotoUrl = ''; });
  }

  // ── Skill gauge builder ──────────────────────────────────────────────
  private buildCvSkills(competences: Competence[]): CvSkill[] {
    const pctMap: Record<string, number> = {
      DEBUTANT:      25,
      INTERMEDIAIRE: 50,
      AVANCE:        75,
      EXPERT:        100
    };

    // Group by category, take top 5 technique + up to 4 others
    const technique   = competences.filter(c => c.categorie === 'TECHNIQUE').slice(0, 5);
    const autres      = competences.filter(c => c.categorie !== 'TECHNIQUE').slice(0, 4);
    const pool        = [...technique, ...autres];

    return pool.map(c => ({
      nom:       c.nom,
      niveau:    c.niveau,
      pct:       pctMap[c.niveau] ?? 50,
      categorie: c.categorie
    }));
  }

  // ── Initials fallback ────────────────────────────────────────────────
  get initials(): string {
    const p = this.collaborateur?.prenom?.charAt(0) ?? '';
    const n = this.collaborateur?.nom?.charAt(0)    ?? '';
    return (p + n).toUpperCase();
  }

  get fullName(): string {
    return `${this.collaborateur?.prenom ?? ''} ${this.collaborateur?.nom ?? ''}`.trim();
  }

  // ────────────────────────────────────────────────────────────────────
  // MAIN METHOD : downloadCV()
  // Uses html2canvas → jsPDF to capture the hidden template and export A4
  // ────────────────────────────────────────────────────────────────────
  async downloadCV(): Promise<void> {
    const el = this.cvTemplate?.nativeElement;
    if (!el) { this.toastService.show('Template CV introuvable', 'error'); return; }

    this.isGenerating = true;
    this.toastService.show('Génération du CV en cours…', 'info');

    try {
      // ── Dynamic import (lazy) to keep initial bundle lean ────────────
      const [html2canvasModule, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const html2canvas = (html2canvasModule as any).default ?? html2canvasModule;

      // ── Make the template temporarily visible for capture ────────────
      const prevVisibility = el.style.visibility;
      const prevPosition   = el.style.position;
      const prevLeft       = el.style.left;
      el.style.visibility  = 'visible';
      el.style.position    = 'fixed';
      el.style.left        = '-9999px';
      el.style.top         = '0';

      // ── html2canvas capture ──────────────────────────────────────────
      const canvas = await html2canvas(el, {
        scale:              2,          // retina-quality
        useCORS:            true,
        allowTaint:         false,
        backgroundColor:    '#0B1120',  // dark bg (matches CV template)
        logging:            false,
        imageTimeout:       8000,
        windowWidth:        794,        // A4 at 96dpi
        onclone: (doc: Document) => {
          // Force all progress bars to their final rendered width
          const bars = doc.querySelectorAll<HTMLElement>('.cv-gauge-fill');
          bars.forEach(b => {
            b.style.transition = 'none';
          });
        }
      });

      // ── Restore visibility ────────────────────────────────────────────
      el.style.visibility = prevVisibility;
      el.style.position   = prevPosition;
      el.style.left       = prevLeft;
      el.style.top        = '';

      // ── Build PDF A4 ──────────────────────────────────────────────────
      const A4_W_MM  = 210;
      const A4_H_MM  = 297;
      const PDF_DPI  = 2;   // matches scale above

      const imgW     = canvas.width;
      const imgH     = canvas.height;

      // Scale image to A4 width
      const ratio    = A4_W_MM / (imgW / PDF_DPI);
      const pdfImgH  = (imgH / PDF_DPI) * ratio;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit:        'mm',
        format:      'a4'
      });

      // If content is taller than one A4 page, split across pages
      if (pdfImgH <= A4_H_MM) {
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, A4_W_MM, pdfImgH);
      } else {
        let yOffset    = 0;
        let pageIndex  = 0;
        const pageH_px = (A4_H_MM * imgW) / A4_W_MM;

        while (yOffset < imgH) {
          if (pageIndex > 0) pdf.addPage();

          const pageCanvas  = document.createElement('canvas');
          pageCanvas.width  = imgW;
          pageCanvas.height = Math.min(pageH_px, imgH - yOffset);
          const ctx = pageCanvas.getContext('2d')!;
          ctx.drawImage(canvas, 0, -yOffset);

          const pageRatio  = A4_W_MM / (pageCanvas.width / PDF_DPI);
          const pageImgH   = (pageCanvas.height / PDF_DPI) * pageRatio;
          pdf.addImage(pageCanvas.toDataURL('image/png'), 'PNG', 0, 0, A4_W_MM, pageImgH);

          yOffset   += pageH_px;
          pageIndex++;
        }
      }

      // ── Download ──────────────────────────────────────────────────────
      const fname = `CV_${this.collaborateur?.nom ?? 'Collaborateur'}_${this.collaborateur?.prenom ?? ''}.pdf`
        .replace(/\s+/g, '_');
      pdf.save(fname);

      this.toastService.show('✅ CV téléchargé avec succès !', 'success');
      this.loadHistory();

    } catch (err) {
      console.error('[CV Export]', err);
      this.toastService.show('Erreur lors de la génération du CV', 'error');
    } finally {
      this.isGenerating = false;
    }
  }

  // ── Keep old backend-based method as fallback ─────────────────────
  generateAndDownload(): void {
    this.downloadCV();
  }

  // ── History CRUD ──────────────────────────────────────────────────
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
