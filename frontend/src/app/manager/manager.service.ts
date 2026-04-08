import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, PagedResponse, CollaborateurSummary, SearchParams, MatriceData, EquipeRequest, EquipeDTO } from '../shared/models/manager.model';

@Injectable({ providedIn: 'root' })
export class ManagerService {
  private apiUrl = '/api/manager';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard`);
  }

  getCollaborateurs(page = 0, size = 10): Observable<PagedResponse<CollaborateurSummary>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PagedResponse<CollaborateurSummary>>(`${this.apiUrl}/collaborateurs`, { params });
  }

  searchCollaborateurs(searchParams: SearchParams, page = 0, size = 10): Observable<PagedResponse<CollaborateurSummary>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchParams.nom) params = params.set('nom', searchParams.nom);
    if (searchParams.competence) params = params.set('competence', searchParams.competence);
    if (searchParams.niveau) params = params.set('niveau', searchParams.niveau);
    if (searchParams.departement) params = params.set('departement', searchParams.departement);

    return this.http.get<PagedResponse<CollaborateurSummary>>(`${this.apiUrl}/collaborateurs/search`, { params });
  }

  getCollaborateurDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/collaborateurs/${id}`);
  }

  getDepartements(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/departements`);
  }

  getMatrice(): Observable<MatriceData> {
    return this.http.get<MatriceData>(`${this.apiUrl}/matrice`);
  }

  exportMatrice(format: 'pdf' | 'xlsx'): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/matrice/export?format=${format}`,
      { responseType: 'blob' }
    );
  }

  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  constituerEquipe(request: EquipeRequest): Observable<EquipeDTO> {
    return this.http.post<EquipeDTO>(
      `${this.apiUrl}/equipe`, request);
  }

  getAllCollaborateursList(): Observable<CollaborateurSummary[]> {
    return this.getCollaborateurs(0, 100).pipe(
      map(response => response.content)
    );
  }
}
