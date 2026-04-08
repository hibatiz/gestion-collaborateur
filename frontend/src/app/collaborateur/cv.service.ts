import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CvMeta } from '../shared/models/cv.model';

@Injectable({
  providedIn: 'root'
})
export class CvService {
  private apiUrl = '/api/cv';

  constructor(private http: HttpClient) { }

  generateCv(collaborateurId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/generate/${collaborateurId}`, {
      responseType: 'blob'
    });
  }

  downloadCv(collaborateurId: number, nomFichier?: string): void {
    this.generateCv(collaborateurId).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nomFichier || `CV_${collaborateurId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  getCvHistory(collaborateurId: number): Observable<CvMeta[]> {
    return this.http.get<CvMeta[]>(`${this.apiUrl}/history/${collaborateurId}`);
  }

  deleteCv(cvId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cvId}`);
  }
}
