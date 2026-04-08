import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ManagerService } from '../manager.service';
import { Collaborateur } from '../../shared/models/collaborateur.model';

@Component({
  selector: 'app-collab-detail',
  templateUrl: './collab-detail.component.html',
  styleUrls: ['./collab-detail.component.scss']
})
export class CollabDetailComponent implements OnInit {
  collab: Collaborateur | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private managerService: ManagerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCollab(+id);
    }
  }

  loadCollab(id: number): void {
    this.isLoading = true;
    this.managerService.getCollaborateurDetail(id).subscribe({
      next: (data) => {
        this.collab = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement détail');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/manager/collaborateurs']);
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A','#2E7CF6','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    const index = nom ? nom.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }

  getInitials(prenom: string, nom: string): string {
    return (prenom?.[0] || '') + (nom?.[0] || '');
  }
}
