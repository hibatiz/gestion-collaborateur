import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenService } from '../core/token.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let tokenService: TokenService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        TokenService,
        { provide: Router, useValue: { navigate: jasmine.createSpy() } }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call login API with correct credentials', () => {
    const mockResponse = { token: 't', role: 'COLLABORATEUR', username: 'u', expiresIn: 1000 };
    
    service.login({ username: 'u', password: 'p' }).subscribe(res => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'u', password: 'p' });
    req.flush(mockResponse);
  });

  it('should save token on successful login', () => {
    spyOn(tokenService, 'saveToken');
    spyOn(tokenService, 'saveRole');

    service.login({ username: 'u', password: 'p' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush({ token: 'mytoken', role: 'COLLABORATEUR', username: 'u', expiresIn: 1000 });

    expect(tokenService.saveToken).toHaveBeenCalledWith('mytoken');
    expect(tokenService.saveRole).toHaveBeenCalledWith('COLLABORATEUR');
  });

  it('should logout by removing token and navigating to login', () => {
    spyOn(tokenService, 'removeToken');
    
    service.logout();

    expect(tokenService.removeToken).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isAuthenticated should return true when token is present', () => {
    spyOn(tokenService, 'isLoggedIn').and.returnValue(true);
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('isAuthenticated should return false when no token', () => {
    spyOn(tokenService, 'isLoggedIn').and.returnValue(false);
    expect(service.isAuthenticated()).toBeFalse();
  });
});
