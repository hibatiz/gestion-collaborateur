import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ManagerRoutingModule } from './manager-routing.module';
import { SharedModule } from '../shared/shared.module';

import { ManagerLayoutComponent } from './manager-layout/manager-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListeCollabsComponent } from './liste-collabs/liste-collabs.component';
import { CollabDetailComponent } from './collab-detail/collab-detail.component';
import { MatriceComponent } from './matrice/matrice.component';
import { EquipeComponent } from './equipe/equipe.component';

@NgModule({
  declarations: [
    ManagerLayoutComponent,
    DashboardComponent,
    ListeCollabsComponent,
    CollabDetailComponent,
    MatriceComponent,
    EquipeComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ManagerRoutingModule,
    SharedModule
  ]
})
export class ManagerModule { }
