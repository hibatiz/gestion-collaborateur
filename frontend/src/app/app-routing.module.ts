import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { CollabLayoutComponent } from './collaborateur/collab-layout/collab-layout.component';
import { ProfilComponent } from './collaborateur/profil/profil.component';
import { CompetencesComponent } from './collaborateur/competences/competences.component';
import { ProjetsComponent } from './collaborateur/projets/projets.component';
import { CvComponent } from './collaborateur/cv/cv.component';

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
    path: 'manager', 
    canActivate: [AuthGuard], 
    data: { role: 'MANAGER' },
    loadChildren: () => import('./manager/manager.module').then(m => m.ManagerModule)
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
