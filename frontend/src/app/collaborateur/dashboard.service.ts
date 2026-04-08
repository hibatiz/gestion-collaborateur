import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollabDashboard, EvolutionData } from '../shared/models/manager.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = '/api/collaborateur';

  constructor(private http: HttpClient) {}

  getCollabDashboard(collaborateurId: number): Observable<CollabDashboard> {
    return this.http.get<CollabDashboard>(
      `${this.apiUrl}/${collaborateurId}/dashboard`);
  }

  getEvolution(collaborateurId: number): Observable<EvolutionData[]> {
    return this.http.get<EvolutionData[]>(
      `${this.apiUrl}/${collaborateurId}/evolution`);
  }

  getCurrentCollab(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me`);
  }
}
