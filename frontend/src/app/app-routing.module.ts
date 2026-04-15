import { NgModule, Injectable } from '@angular/core';
import { RouterModule, Routes, TitleStrategy, RouterStateSnapshot } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { LoginComponent } from './auth/login/login.component';
import { AuthGuard } from './auth/auth.guard';
import { CollabLayoutComponent } from './collaborateur/collab-layout/collab-layout.component';
import { ProfilComponent } from './collaborateur/profil/profil.component';
import { CompetencesComponent } from './collaborateur/competences/competences.component';
import { ProjetsComponent } from './collaborateur/projets/projets.component';
import { CvComponent } from './collaborateur/cv/cv.component';
import { DashboardComponent } from './collaborateur/dashboard/dashboard.component';

@Injectable({providedIn: 'root'})
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const title = this.buildTitle(routerState);
    if (title !== undefined) {
      this.title.setTitle(`${title} | Mao Conseils - Gestion Collaborateurs`);
    } else {
      this.title.setTitle(`Mao Conseils - Gestion Collaborateurs`);
    }
  }
}

const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Connexion' },
  { 
    path: 'collab', 
    component: CollabLayoutComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'COLLABORATEUR' },
    children: [
      { path: 'dashboard', component: DashboardComponent, title: 'Tableau de bord' },
      { path: 'profil', component: ProfilComponent, title: 'Mon Profil' },
      { path: 'competences', component: CompetencesComponent, title: 'Mes Compétences' },
      { path: 'projets', component: ProjetsComponent, title: 'Mes Projets' },
      { path: 'cv', component: CvComponent, title: 'Mon CV' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { 
    path: 'manager', 
    canActivate: [AuthGuard], 
    data: { role: 'MANAGER' },
    title: 'Espace Manager',
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
