import { Component, OnInit } from '@angular/core';
import { ManagerService } from '../manager.service';
import { MatriceData, CollabRow } from '../../shared/models/manager.model';

@Component({
  selector: 'app-matrice',
  templateUrl: './matrice.component.html',
  styleUrls: ['./matrice.component.scss']
})
export class MatriceComponent implements OnInit {
  matrice: MatriceData | null = null;
  isLoading = true;
  isExporting = false;
  filterText = '';
  exportingFormat: 'pdf' | 'xlsx' | null = null;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.managerService.getMatrice().subscribe({
      next: (data) => {
        this.matrice = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get filteredCompetences(): string[] {
    if (!this.filterText.trim()) return this.matrice?.competences || [];
    return this.matrice?.competences.filter(c =>
      c.toLowerCase().includes(this.filterText.toLowerCase())) || [];
  }

  get filteredRows(): CollabRow[] {
    return this.matrice?.collaborateurs || [];
  }

  exportPdf(): void {
    this.exportingFormat = 'pdf';
    this.managerService.exportMatrice('pdf').subscribe({
      next: (blob) => {
        this.managerService.triggerDownload(blob, 'matrice_competences.pdf');
        this.exportingFormat = null;
      },
      error: () => this.exportingFormat = null
    });
  }

  exportExcel(): void {
    this.exportingFormat = 'xlsx';
    this.managerService.exportMatrice('xlsx').subscribe({
      next: (blob) => {
        this.managerService.triggerDownload(blob, 'matrice_competences.xlsx');
        this.exportingFormat = null;
      },
      error: () => this.exportingFormat = null
    });
  }

  getNiveauClass(niveau: string | null): string {
    if (!niveau) return 'cell-empty';
    const map: any = {
      DEBUTANT: 'cell-debutant',
      INTERMEDIAIRE: 'cell-inter',
      AVANCE: 'cell-avance',
      EXPERT: 'cell-expert'
    };
    return map[niveau] || 'cell-empty';
  }

  getNiveauLabel(niveau: string | null): string {
    if (!niveau) return '';
    const map: any = {
      DEBUTANT: 'DEB',
      INTERMEDIAIRE: 'INT',
      AVANCE: 'AVA',
      EXPERT: 'EXP'
    };
    return map[niveau] || '';
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A', '#2E7CF6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    if (!nom) return colors[0];
    return colors[nom.charCodeAt(0) % colors.length];
  }
}
