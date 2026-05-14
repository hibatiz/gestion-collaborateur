import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-collab-layout',
  templateUrl: './collab-layout.component.html',
  styleUrls: ['./collab-layout.component.scss']
})
export class CollabLayoutComponent {

  constructor(
    private authService:  AuthService,
    private router:       Router,
    public  themeService: ThemeService   // public → accessible depuis le template
  ) {}

  getUserIdentifier(): string {
    return this.authService.getCurrentUser() || 'User';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
