import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CollabLayoutComponent } from './collab-layout/collab-layout.component';
import { ProfilComponent } from './profil/profil.component';
import { CompetencesComponent } from './competences/competences.component';
import { ProjetsComponent } from './projets/projets.component';
import { CvComponent } from './cv/cv.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    CollabLayoutComponent,
    ProfilComponent,
    CompetencesComponent,
    ProjetsComponent,
    CvComponent,
    DashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule
  ]
})
export class CollaborateurModule { }
