import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // User is accessing /login
    if (state.url.includes('/login')) {
      if (this.authService.isAuthenticated()) {
        const role = this.authService.getRole();
        if (role === 'COLLABORATEUR') {
          return this.router.parseUrl('/collab/dashboard');
        } else if (role === 'MANAGER') {
          return this.router.parseUrl('/manager/dashboard');
        }
        return this.router.parseUrl('/login'); // Fallback
      }
      return true; // Allow access to login if not authenticated
    }

    // Protected routes
    if (!this.authService.isAuthenticated()) {
      return this.router.parseUrl('/login');
    }

    const requiredRole = route.data['role'];
    if (requiredRole && this.authService.getRole() !== requiredRole) {
       // Role doesn't match, maybe redirect somewhere or to login 
       // For this task, if manager tries collab route we redirect to login to be simple.
       return this.router.parseUrl('/login');
    }

    return true;
  }
}
