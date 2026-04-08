import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManagerLayoutComponent } from './manager-layout/manager-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListeCollabsComponent } from './liste-collabs/liste-collabs.component';
import { CollabDetailComponent } from './collab-detail/collab-detail.component';
import { MatriceComponent } from './matrice/matrice.component';
import { EquipeComponent } from './equipe/equipe.component';

const routes: Routes = [
  {
    path: '',
    component: ManagerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'collaborateurs', component: ListeCollabsComponent },
      { path: 'collaborateurs/:id', component: CollabDetailComponent },
      { path: 'matrice', component: MatriceComponent },
      { path: 'equipe', component: EquipeComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManagerRoutingModule { }
