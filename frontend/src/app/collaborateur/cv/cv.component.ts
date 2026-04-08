import { Component, OnInit } from '@angular/core';
import { CollaborateurService } from '../collaborateur.service';
import { CvService } from '../cv.service';
import { ToastService } from '../../shared/toast/toast.service';
import { CvMeta } from '../../shared/models/cv.model';
import { Collaborateur } from '../../shared/models/collaborateur.model';

@Component({
  selector: 'app-cv',
  templateUrl: './cv.component.html',
  styleUrls: ['./cv.component.scss']
})
export class CvComponent implements OnInit {
  collaborateurId = 1;
  collaborateur: Collaborateur | null = null;
  competencesCount = 0;
  projetsCount = 0;
  cvHistory: CvMeta[] = [];
  isGenerating = false;
  isLoadingHistory = false;
  deleteConfirmId: number | null = null;

  constructor(
    private collabService: CollaborateurService,
    private cvService: CvService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.loadHistory();
  }

  loadData(): void {
    this.collabService.getProfile(this.collaborateurId).subscribe({
      next: (data) => {
        this.collaborateur = data;
      },
      error: () => this.toastService.show('Erreur de chargement du profil', 'error')
    });

    this.collabService.getCompetences(this.collaborateurId).subscribe({
      next: (data) => this.competencesCount = data.length,
      error: () => console.error('Erreur chargement competences')
    });

    this.collabService.getProjets(this.collaborateurId).subscribe({
      next: (data) => this.projetsCount = data.length,
      error: () => console.error('Erreur chargement projets')
    });
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.cvService.getCvHistory(this.collaborateurId).subscribe({
      next: (data) => {
        this.cvHistory = data;
        this.isLoadingHistory = false;
      },
      error: () => {
        this.toastService.show("Erreur lors du chargement de l'historique", 'error');
        this.isLoadingHistory = false;
      }
    });
  }

  generateAndDownload(): void {
    this.isGenerating = true;
    this.cvService.generateCv(this.collaborateurId).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const filename = `CV_${this.collaborateur?.nom || 'Collaborateur'}_${this.collaborateur?.prenom || ''}.pdf`.replace(/\s+/g, '_');
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.toastService.show('CV généré et téléchargé avec succès !', 'success');
        this.isGenerating = false;
        this.loadHistory();
      },
      error: () => {
        this.toastService.show('Erreur lors de la génération du CV', 'error');
        this.isGenerating = false;
      }
    });
  }

  confirmDeleteCv(id: number): void {
    this.deleteConfirmId = id;
  }

  executeDeleteCv(id: number): void {
    this.cvService.deleteCv(id).subscribe({
      next: () => {
        this.toastService.show('CV supprimé de l\'historique', 'success');
        this.loadHistory();
        this.deleteConfirmId = null;
      },
      error: () => {
        this.toastService.show('Erreur lors de la suppression', 'error');
      }
    });
  }
}
