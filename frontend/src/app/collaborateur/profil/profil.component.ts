import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CollaborateurService } from '../collaborateur.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Collaborateur } from '../../shared/models/collaborateur.model';

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.scss']
})
export class ProfilComponent implements OnInit {
  isEditMode = false;
  profileForm!: FormGroup;
  profile: Collaborateur | null = null;
  loading = false;
  // Fallback ID for testing until a login that maps to collaborateur ID is made.
  // Assuming '1' since data initializer creates collab profile 1.
  collabId = 1;

  constructor(
    private fb: FormBuilder,
    private collabService: CollaborateurService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProfile();
  }

  initForm() {
    this.profileForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      poste: [''],
      departement: [''],
      anneesExperience: [0, [Validators.min(0), Validators.max(50)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['']
    });
  }

  loadProfile() {
    this.loading = true;
    this.collabService.getProfile(this.collabId).subscribe({
      next: (data) => {
        this.profile = data;
        this.profileForm.patchValue(data);
        this.loading = false;
      },
      error: (err) => {
        this.toastService.show('Erreur de chargement du profil', 'error');
        this.loading = false;
      }
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.profile) {
       this.profileForm.patchValue(this.profile); // restore if cancelled
    }
  }

  saveProfile() {
    if (this.profileForm.invalid) return;
    this.loading = true;
    this.collabService.updateProfile(this.collabId, this.profileForm.value).subscribe({
      next: (data) => {
        this.profile = data;
        this.isEditMode = false;
        this.toastService.show('Profil mis à jour avec succès', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.toastService.show('Erreur lors de la mise à jour', 'error');
        this.loading = false;
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.show('Le fichier est trop volumineux (max 5MB)', 'error');
        return;
      }
      
      // Optioanally preview right away with FileReader, but we upload then update photoUrl
      const reader = new FileReader();
      reader.onload = (e: any) => {
         if (this.profile) this.profile.photoUrl = e.target.result; // temp preview
      };
      reader.readAsDataURL(file);

      this.collabService.uploadPhoto(this.collabId, file).subscribe({
        next: (res) => {
          this.toastService.show('Photo mise à jour', 'success');
          // Update profile photo url logic here if backend returned pure file name
          if (this.profile) this.profile.photoUrl = res.photoUrl; 
        },
        error: (err) => {
          this.toastService.show("Erreur lors de l'upload", 'error');
        }
      });
    }
  }
}
