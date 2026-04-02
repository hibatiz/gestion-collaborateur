import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Collaborateur, 
  Competence, 
  CompetenceRequest, 
  UpdateProfileRequest 
} from '../shared/models/collaborateur.model';

@Injectable({
  providedIn: 'root'
})
export class CollaborateurService {
  private apiUrl = '/api/collaborateur';

  constructor(private http: HttpClient) {}

  getProfile(id: number): Observable<Collaborateur> {
    return this.http.get<Collaborateur>(`${this.apiUrl}/${id}`);
  }

  updateProfile(id: number, data: UpdateProfileRequest): Observable<Collaborateur> {
    return this.http.put<Collaborateur>(`${this.apiUrl}/${id}`, data);
  }

  uploadPhoto(id: number, file: File): Observable<{photoUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{photoUrl: string}>(`${this.apiUrl}/${id}/photo`, formData);
  }

  getCompetences(id: number): Observable<Competence[]> {
    return this.http.get<Competence[]>(`${this.apiUrl}/${id}/competences`);
  }

  addCompetence(id: number, req: CompetenceRequest): Observable<Competence> {
    return this.http.post<Competence>(`${this.apiUrl}/${id}/competences`, req);
  }

  updateNiveau(collabId: number, compId: number, niveau: string): Observable<Competence> {
    return this.http.put<Competence>(`${this.apiUrl}/${collabId}/competences/${compId}`, { niveau });
  }

  deleteCompetence(collabId: number, compId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${collabId}/competences/${compId}`);
  }
}
