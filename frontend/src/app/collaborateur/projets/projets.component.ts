import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborateurService } from '../collaborateur.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Projet, ProjetRequest } from '../../shared/models/projet.model';

@Component({
  selector: 'app-projets',
  templateUrl: './projets.component.html',
  styleUrls: ['./projets.component.scss']
})
export class ProjetsComponent implements OnInit {
  collaborateurId = 1; // Fallback similarly to ProfilComponent
  projets: Projet[] = [];
  isLoading = false;
  isPanelOpen = false;
  editingProjet: Projet | null = null;
  isSubmitting = false;
  deleteConfirmId: number | null = null;

  projetForm: FormGroup;
  techTags: string[] = [];
  techInput = '';

  constructor(
    private fb: FormBuilder,
    private collabService: CollaborateurService,
    private toastService: ToastService
  ) {
    this.projetForm = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      dateDebut: ['', Validators.required],
      dateFin: [null],
      enCours: [false],
      role: [''],
      technologies: ['']
    });
  }

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets(): void {
    this.isLoading = true;
    this.collabService.getProjets(this.collaborateurId).subscribe({
      next: (data) => {
        this.projets = data;
        this.isLoading = false;
      },
      error: () => {
        this.toastService.show('Erreur lors du chargement des projets', 'error');
        this.isLoading = false;
      }
    });
  }

  openAddPanel(): void {
    this.editingProjet = null;
    this.projetForm.reset({
      nom: '',
      description: '',
      dateDebut: '',
      dateFin: null,
      enCours: false,
      role: '',
      technologies: ''
    });
    this.techTags = [];
    this.isPanelOpen = true;
  }

  openEditPanel(p: Projet): void {
    this.editingProjet = p;
    this.projetForm.patchValue({
      nom: p.nom,
      description: p.description,
      dateDebut: p.dateDebut,
      dateFin: p.dateFin,
      enCours: p.enCours,
      role: p.role
    });
    this.techTags = p.technologies ? p.technologies.split(',').map(t => t.trim()).filter(t => t !== '') : [];
    this.isPanelOpen = true;
    this.onEnCoursChange();
  }

  closePanel(): void {
    this.isPanelOpen = false;
  }

  onEnCoursChange(): void {
    const enCours = this.projetForm.get('enCours')?.value;
    const dateFinControl = this.projetForm.get('dateFin');
    if (enCours) {
      dateFinControl?.setValue(null);
      dateFinControl?.disable();
    } else {
      dateFinControl?.enable();
    }
  }

  addTechTag(): void {
    const val = this.techInput.trim().replace(/,/g, '');
    if (val && !this.techTags.includes(val)) {
      this.techTags.push(val);
    }
    this.techInput = '';
  }

  onTechKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTechTag();
    }
  }

  removeTechTag(tag: string): void {
    this.techTags = this.techTags.filter(t => t !== tag);
  }

  submitForm(): void {
    if (this.projetForm.invalid) {
      this.projetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formVal = this.projetForm.getRawValue();
    const request: ProjetRequest = {
      nom: formVal.nom,
      description: formVal.description,
      dateDebut: formVal.dateDebut,
      dateFin: formVal.enCours ? null : formVal.dateFin,
      role: formVal.role,
      technologies: this.techTags.join(',')
    };

    const obs = this.editingProjet 
      ? this.collabService.updateProjet(this.collaborateurId, this.editingProjet.id, request)
      : this.collabService.addProjet(this.collaborateurId, request);

    obs.subscribe({
      next: () => {
        this.toastService.show(this.editingProjet ? 'Projet modifié' : 'Projet ajouté', 'success');
        this.loadProjets();
        this.closePanel();
        this.isSubmitting = false;
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Une erreur est survenue', 'error');
        this.isSubmitting = false;
      }
    });
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  executeDelete(id: number): void {
    this.collabService.deleteProjet(this.collaborateurId, id).subscribe({
      next: () => {
        this.toastService.show('Projet supprimé', 'success');
        this.loadProjets();
        this.deleteConfirmId = null;
      },
      error: () => {
        this.toastService.show('Erreur lors de la suppression', 'error');
      }
    });
  }
}
