import { Component, OnInit } from '@angular/core';
import { ManagerService } from '../manager.service';
import { CollaborateurSummary, EquipeDTO, EquipeRequest } from '../../shared/models/manager.model';

@Component({
  selector: 'app-equipe',
  templateUrl: './equipe.component.html',
  styleUrls: ['./equipe.component.scss']
})
export class EquipeComponent implements OnInit {

  allCollabs:         CollaborateurSummary[] = [];
  filteredCollabs:    CollaborateurSummary[] = [];
  selectedIds:        Set<number> = new Set();
  searchText        = '';
  projetNom         = '';
  competencesRequises: string[] = [];
  competenceInput   = '';
  result:            EquipeDTO | null = null;
  isLoading         = false;
  isSubmitting      = false;

  // ── Feature C: Smart Match ────────────────────────────────
  /** Computed best-fit profiles based on required competences */
  smartMatchResults:  CollaborateurSummary[] = [];
  isScanning         = false;   // drives the scan animation
  showSmartResults   = false;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.managerService.getAllCollaborateursList().subscribe({
      next: (data) => {
        this.allCollabs      = data;
        this.filteredCollabs = data;
        this.isLoading       = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ── Standard search ─────────────────────────────────────────
  onSearch(): void {
    this.filteredCollabs = this.allCollabs.filter(c =>
      (c.nom + ' ' + c.prenom + ' ' + c.poste)
        .toLowerCase().includes(this.searchText.toLowerCase()));
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else                           this.selectedIds.add(id);
  }

  isSelected(id: number): boolean { return this.selectedIds.has(id); }

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

  // ════════════════════════════════════════════════════════════
  // FEATURE C – Smart Match: Generate Optimal Team
  // ════════════════════════════════════════════════════════════

  /**
   * Ranks every collaborator by how many of the required competences
   * match their topCompetences list (case-insensitive).
   * Triggers a "scan" animation before revealing results.
   */
  smartMatch(): void {
    if (this.competencesRequises.length === 0) return;

    this.isScanning      = true;
    this.showSmartResults = false;
    this.smartMatchResults = [];

    // ── Scoring algorithm ──────────────────────────────────
    const scored = this.allCollabs
      .map(c => {
        const score = this.competencesRequises.reduce((acc, req) => {
          const match = c.topCompetences?.some(tc =>
            tc.toLowerCase().includes(req.toLowerCase())
          );
          return acc + (match ? 1 : 0);
        }, 0);
        return { collab: c, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    // ── Simulate scan delay then reveal ───────────────────
    setTimeout(() => {
      this.isScanning       = false;
      this.showSmartResults = true;
      // Take top 5 matches
      this.smartMatchResults = scored.slice(0, 5).map(x => x.collab);

      // Auto-select the matched profiles
      this.smartMatchResults.forEach(c => this.selectedIds.add(c.id));
    }, 2200);
  }

  getMatchScore(collab: CollaborateurSummary): number {
    if (!this.competencesRequises.length) return 0;
    return this.competencesRequises.reduce((acc, req) => {
      return acc + (collab.topCompetences?.some(tc =>
        tc.toLowerCase().includes(req.toLowerCase())) ? 1 : 0);
    }, 0);
  }

  // ── Standard submit ─────────────────────────────────────────
  constituerEquipe(): void {
    if (!this.projetNom.trim() || this.selectedIds.size === 0) return;
    this.isSubmitting = true;
    const request: EquipeRequest = {
      projetNom:           this.projetNom,
      collaborateurIds:    Array.from(this.selectedIds),
      competencesRequises: this.competencesRequises
    };
    this.managerService.constituerEquipe(request).subscribe({
      next: (data) => { this.result = data;   this.isSubmitting = false; },
      error: ()    => {                        this.isSubmitting = false; }
    });
  }

  reset(): void {
    this.result           = null;
    this.projetNom        = '';
    this.selectedIds.clear();
    this.competencesRequises = [];
    this.searchText        = '';
    this.filteredCollabs   = this.allCollabs;
    this.smartMatchResults = [];
    this.showSmartResults  = false;
    this.isScanning        = false;
  }

  getAvatarColor(nom: string): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed'];
    return colors[(nom?.charCodeAt(0) ?? 0) % colors.length];
  }
}
