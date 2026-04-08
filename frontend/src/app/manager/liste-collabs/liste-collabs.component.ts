import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ManagerService } from '../manager.service';
import { CollaborateurSummary } from '../../shared/models/manager.model';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-liste-collabs',
  templateUrl: './liste-collabs.component.html',
  styleUrls: ['./liste-collabs.component.scss']
})
export class ListeCollabsComponent implements OnInit {
  collabs: CollaborateurSummary[] = [];
  isLoading = false;
  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 9;
  departements: string[] = [];

  searchForm: FormGroup;

  constructor(
    private managerService: ManagerService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      nom: [''],
      competence: [''],
      niveau: [''],
      departement: ['']
    });
  }

  ngOnInit(): void {
    this.loadDepartements();
    this.loadCollabs();

    this.searchForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadCollabs();
    });
  }

  loadCollabs(): void {
    this.isLoading = true;
    const params = this.searchForm.value;
    const hasFilters = Object.values(params).some(v => v && v !== '');

    const obs = hasFilters
      ? this.managerService.searchCollaborateurs(params, this.currentPage, this.pageSize)
      : this.managerService.getCollaborateurs(this.currentPage, this.pageSize);

    obs.subscribe({
      next: (data) => {
        this.collabs = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement collaborateurs');
      }
    });
  }

  loadDepartements(): void {
    this.managerService.getDepartements().subscribe(d => this.departements = d);
  }

  resetFilters(): void {
    this.searchForm.reset({
      nom: '',
      competence: '',
      niveau: '',
      departement: ''
    }, { emitEvent: false });
    this.currentPage = 0;
    this.loadCollabs();
  }

  hasActiveFilters(): boolean {
    return Object.values(this.searchForm.value).some(v => v && v !== '');
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadCollabs();
    }
  }

  getPagesArray(): number[] {
    const pages = [];
    const maxVisiblePages = 7;
    let start = Math.max(0, this.currentPage - 3);
    let end = Math.min(this.totalPages - 1, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(0, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A','#2E7CF6','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    const index = nom ? nom.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0] || '') + (nom?.[0] || '');
  }
}
