import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'parseUrl']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should allow navigation when authenticated and role matches', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getRole.and.returnValue('COLLABORATEUR');
    
    const route: any = { data: { role: 'COLLABORATEUR' } };
    const state: any = { url: '/collab/profil' };

    expect(guard.canActivate(route, state)).toBeTrue();
  });

  it('should redirect back to login when role does NOT match', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getRole.and.returnValue('COLLABORATEUR');
    
    const route: any = { data: { role: 'MANAGER' } }; // Expecting Manager
    const state: any = { url: '/manager/dashboard' };

    const mockUrlTree = {} as any;
    routerSpy.parseUrl.and.returnValue(mockUrlTree);

    expect(guard.canActivate(route, state)).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/login');
  });

  it('should allow access to login if NOT authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    
    const route: any = {};
    const state: any = { url: '/login' };

    expect(guard.canActivate(route, state)).toBeTrue();
  });
});
