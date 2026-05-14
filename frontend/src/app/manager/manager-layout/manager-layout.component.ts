import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TokenService } from '../../core/token.service';
import { ThemeService } from '../../core/theme.service';

@Component({
  selector: 'app-manager-layout',
  templateUrl: './manager-layout.component.html',
  styleUrls: ['./manager-layout.component.scss']
})
export class ManagerLayoutComponent implements OnInit {
  username: string = '';

  constructor(
    private authService:  AuthService,
    private tokenService: TokenService,
    private router:       Router,
    public  themeService: ThemeService   // public → accessible depuis le template
  ) {}

  ngOnInit(): void {
    this.username = this.tokenService.getUsername() || 'Manager';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
