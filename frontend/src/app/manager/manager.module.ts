import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagerRoutingModule } from './manager-routing.module';
import { SharedModule } from '../shared/shared.module';

import { ManagerLayoutComponent } from './manager-layout/manager-layout.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ListeCollabsComponent } from './liste-collabs/liste-collabs.component';
import { CollabDetailComponent } from './collab-detail/collab-detail.component';

@Component({
  template: `
    <div style="padding:40px; text-align:center; color:#64748B">
      <h2>🚧 En construction</h2>
      <p>Cette fonctionnalité sera disponible dans le prochain sprint.</p>
    </div>`
})
export class PlaceholderManagerComponent {}

@NgModule({
  declarations: [
    ManagerLayoutComponent,
    DashboardComponent,
    ListeCollabsComponent,
    CollabDetailComponent,
    PlaceholderManagerComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ManagerRoutingModule,
    SharedModule
  ]
})
export class ManagerModule { }
