import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
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
  previewUrl: SafeUrl | null = null;
  // Fallback ID for testing until a login that maps to collaborateur ID is made.
  // Assuming '1' since data initializer creates collab profile 1.
  collabId = 1;

  constructor(
    private fb: FormBuilder,
    private collabService: CollaborateurService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
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
    if (this.loading) return; // Prevent concurrent actions
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.show('Le fichier est trop volumineux (max 5MB)', 'error');
        event.target.value = ''; // Clear for same file selection
        return;
      }
      
      this.loading = true; // Lock the UI to prevent saveProfile race conditions
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
         // Use DomSanitizer to explicitly trust the Data URL for the image src
         this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(e.target.result as string);
         this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      this.collabService.uploadPhoto(this.collabId, file).subscribe({
        next: (res) => {
          this.toastService.show('Photo mise à jour', 'success');
          if (this.profile) this.profile.photoUrl = res.photoUrl; 
          this.previewUrl = null;
          event.target.value = ''; // Clear for same file selection
          this.loading = false; // Restore UI state
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toastService.show("Erreur lors de l'upload", 'error');
          event.target.value = ''; // Clear for same file selection
          this.loading = false; // Restore UI state
          this.cdr.detectChanges();
        }
      });
    }
  }
}
