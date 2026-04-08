import { Component, OnInit } from '@angular/core';
import { ManagerService } from '../manager.service';
import { CollaborateurSummary, EquipeDTO, EquipeRequest } from '../../shared/models/manager.model';

@Component({
  selector: 'app-equipe',
  templateUrl: './equipe.component.html',
  styleUrls: ['./equipe.component.scss']
})
export class EquipeComponent implements OnInit {
  allCollabs: CollaborateurSummary[] = [];
  filteredCollabs: CollaborateurSummary[] = [];
  selectedIds: Set<number> = new Set();
  searchText = '';
  projetNom = '';
  competencesRequises: string[] = [];
  competenceInput = '';
  result: EquipeDTO | null = null;
  isLoading = false;
  isSubmitting = false;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.managerService.getAllCollaborateursList().subscribe({
      next: (data) => {
        this.allCollabs = data;
        this.filteredCollabs = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.filteredCollabs = this.allCollabs.filter(c =>
      (c.nom + ' ' + c.prenom + ' ' + c.poste)
        .toLowerCase().includes(this.searchText.toLowerCase()));
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  addCompetenceTag(): void {
    const val = this.competenceInput.trim();
    if (val && !this.competencesRequises.includes(val)) {
      this.competencesRequises.push(val);
      this.competenceInput = '';
    }
  }

  onCompetenceKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addCompetenceTag();
    }
  }

  removeCompetenceTag(tag: string): void {
    this.competencesRequises = this.competencesRequises.filter(t => t !== tag);
  }

  constituerEquipe(): void {
    if (!this.projetNom.trim() || this.selectedIds.size === 0) return;
    
    this.isSubmitting = true;
    const request: EquipeRequest = {
      projetNom: this.projetNom,
      collaborateurIds: Array.from(this.selectedIds),
      competencesRequises: this.competencesRequises
    };

    this.managerService.constituerEquipe(request).subscribe({
      next: (data) => {
        this.result = data;
        this.isSubmitting = false;
      },
      error: () => {
        this.isSubmitting = false;
      }
    });
  }

  reset(): void {
    this.result = null;
    this.projetNom = '';
    this.selectedIds.clear();
    this.competencesRequises = [];
    this.searchText = '';
    this.filteredCollabs = this.allCollabs;
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A', '#2E7CF6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    if (!nom) return colors[0];
    return colors[nom.charCodeAt(0) % colors.length];
  }
}
