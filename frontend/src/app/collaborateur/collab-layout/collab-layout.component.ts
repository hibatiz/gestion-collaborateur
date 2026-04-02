import { Component } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-collab-layout',
  templateUrl: './collab-layout.component.html',
  styleUrls: ['./collab-layout.component.scss']
})
export class CollabLayoutComponent {
  
  constructor(private authService: AuthService, private router: Router) {}

  getUserIdentifier() {
    return this.authService.getCurrentUser() || 'User';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
