import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TokenService] });
    service = TestBed.inject(TokenService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should save token to localStorage', () => {
    service.saveToken('test-token');
    expect(localStorage.getItem('jwt_token')).toBe('test-token');
  });

  it('should retrieve token from localStorage', () => {
    localStorage.setItem('jwt_token', 'my-secret-token');
    expect(service.getToken()).toBe('my-secret-token');
  });

  it('should remove token from localStorage', () => {
    localStorage.setItem('jwt_token', 'remove-me');
    service.removeToken();
    expect(localStorage.getItem('jwt_token')).toBeNull();
  });

  it('isTokenExpired should return true for an expired token', () => {
    const expiredToken = buildJwt(Math.floor(Date.now() / 1000) - 3600); // 1h ago
    service.saveToken(expiredToken);
    expect(service.isTokenExpired()).toBeTrue();
  });

  it('isTokenExpired should return false for a valid token', () => {
    const validToken = buildJwt(Math.floor(Date.now() / 1000) + 3600); // 1h future
    service.saveToken(validToken);
    expect(service.isTokenExpired()).toBeFalse();
  });

  // Helper to build a JWT string with specific expiration
  function buildJwt(exp: number): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'user1', exp: exp }));
    return `${header}.${payload}.signature`;
  }
});
