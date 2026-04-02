import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborateurService } from '../collaborateur.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Competence, CompetenceRequest } from '../../shared/models/collaborateur.model';

@Component({
  selector: 'app-competences',
  templateUrl: './competences.component.html',
  styleUrls: ['./competences.component.scss']
})
export class CompetencesComponent implements OnInit {
  competences: Competence[] = [];
  groupedCompetences: {[key: string]: Competence[]} = {};
  
  compForm!: FormGroup;
  isEditMode = false;
  editingCompId: number | null = null;
  loading = false;
  collabId = 1;

  commonTechSkills = ['Java', 'Spring Boot', 'Angular', 'React', 'MySQL', 'Docker', 'Git', 'Kubernetes'];

  niveaux = ['DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'EXPERT'];

  constructor(
    private fb: FormBuilder,
    private collabService: CollaborateurService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadCompetences();
  }

  initForm() {
    this.compForm = this.fb.group({
      nom: ['', Validators.required],
      categorie: ['TECHNIQUE', Validators.required],
      niveau: ['DEBUTANT', Validators.required],
      dateAcquisition: [new Date().toISOString().substring(0, 10)]
    });
  }

  loadCompetences() {
    this.collabService.getCompetences(this.collabId).subscribe({
      next: (data) => {
        this.competences = data;
        this.groupCompetences();
      },
      error: () => this.toastService.show('Erreur de chargement des compétences', 'error')
    });
  }

  groupCompetences() {
    this.groupedCompetences = {
      'TECHNIQUE': [],
      'OUTIL': [],
      'METHODOLOGIE': [],
      'LANGUE': []
    };
    
    this.competences.forEach(c => {
      if (!this.groupedCompetences[c.categorie]) {
        this.groupedCompetences[c.categorie] = [];
      }
      this.groupedCompetences[c.categorie].push(c);
    });
  }

  getNiveauClass(niveau: string): string {
    return `badge-${niveau.toLowerCase()}`;
  }

  setNiveau(niveau: string) {
    this.compForm.patchValue({ niveau });
  }

  submit() {
    if (this.compForm.invalid) return;
    
    this.loading = true;
    if (this.isEditMode && this.editingCompId) {
      const niveau = this.compForm.value.niveau;
      this.collabService.updateNiveau(this.collabId, this.editingCompId, niveau).subscribe({
        next: () => {
          this.toastService.show('Compétence modifiée', 'success');
          this.resetForm();
          this.loadCompetences();
          this.loading = false;
        },
        error: () => {
          this.toastService.show('Erreur lors de la modification', 'error');
          this.loading = false;
        }
      });
    } else {
      const req: CompetenceRequest = this.compForm.value;
      this.collabService.addCompetence(this.collabId, req).subscribe({
        next: () => {
          this.toastService.show('Compétence ajoutée', 'success');
          this.resetForm();
          this.loadCompetences();
          this.loading = false;
        },
        error: (err) => {
          if (err.status === 409) {
            this.toastService.show('Cette compétence est déjà sur votre profil', 'info');
          } else {
            this.toastService.show("Erreur lors de l'ajout", 'error');
          }
          this.loading = false;
        }
      });
    }
  }

  editCompetence(comp: Competence) {
    this.isEditMode = true;
    this.editingCompId = comp.id;
    this.compForm.patchValue({
      nom: comp.nom,
      categorie: comp.categorie,
      niveau: comp.niveau,
      dateAcquisition: comp.dateAcquisition
    });
    // Disable fields that shouldn't be edited aside from niveau
    this.compForm.get('nom')?.disable();
    this.compForm.get('categorie')?.disable();
  }

  deleteCompetence(compId: number, nom: string) {
    if (confirm(`Voulez-vous vraiment supprimer la compétence ${nom} ?`)) {
      this.collabService.deleteCompetence(this.collabId, compId).subscribe({
        next: () => {
          this.toastService.show('Compétence supprimée', 'success');
          this.loadCompetences();
        },
        error: () => this.toastService.show('Erreur lors de la suppression', 'error')
      });
    }
  }

  resetForm() {
    this.isEditMode = false;
    this.editingCompId = null;
    this.compForm.reset();
    this.compForm.enable();
    this.compForm.patchValue({
      categorie: 'TECHNIQUE',
      niveau: 'DEBUTANT',
      dateAcquisition: new Date().toISOString().substring(0, 10)
    });
  }
}
