import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TokenService } from '../../core/auth/token.service';

@Component({
  selector: 'app-manager-layout',
  templateUrl: './manager-layout.component.html',
  styleUrls: ['./manager-layout.component.scss']
})
export class ManagerLayoutComponent implements OnInit {
  username: string = '';

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.username = this.tokenService.getUsername() || 'Manager';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
