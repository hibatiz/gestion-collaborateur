import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { CollabLayoutComponent } from './collaborateur/collab-layout/collab-layout.component';
import { ProfilComponent } from './collaborateur/profil/profil.component';
import { CompetencesComponent } from './collaborateur/competences/competences.component';

@Component({
  template: '<h2>Espace Manager — À venir</h2>'
})
export class ManagerDashboardComponent {}

@Component({
  template: '<h2>Projets — Sprint 2</h2>'
})
export class ProjetsComponent {}

@Component({
  template: '<h2>CV — Sprint 2</h2>'
})
export class CvComponent {}

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'collab', 
    component: CollabLayoutComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'COLLABORATEUR' },
    children: [
      { path: 'profil', component: ProfilComponent },
      { path: 'competences', component: CompetencesComponent },
      { path: 'projets', component: ProjetsComponent },
      { path: 'cv', component: CvComponent },
      { path: '', redirectTo: 'profil', pathMatch: 'full' }
    ]
  },
  { 
    path: 'manager/dashboard', 
    component: ManagerDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'MANAGER' } 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  declarations: [
    ManagerDashboardComponent,
    ProjetsComponent,
    CvComponent
  ],
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
