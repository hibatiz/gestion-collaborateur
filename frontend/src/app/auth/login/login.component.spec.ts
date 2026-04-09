import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated', 'getRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Default return values for ngOnInit
    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submit button should be disabled when form is empty', () => {
    component.loginForm.reset();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  it('should show error message on 401 response', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ status: 401, error: { message: 'Invalide' } })));
    
    component.loginForm.setValue({ username: 'wrong', password: 'pwd' });
    component.onSubmit();
    fixture.detectChanges();

    expect(component.errorMessage).toBe('Invalide');
  });

  it('should navigate to collab profil on successful COLLABORATEUR login', () => {
    authServiceSpy.login.and.returnValue(of({
      token: 't', role: 'COLLABORATEUR', username: 'u', expiresIn: 1000
    }));

    component.loginForm.setValue({ username: 'u', password: 'p' });
    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/collab/profil']);
  });

  it('should navigate to manager dashboard on successful MANAGER login', () => {
    authServiceSpy.login.and.returnValue(of({
      token: 't', role: 'MANAGER', username: 'm', expiresIn: 1000
    }));

    component.loginForm.setValue({ username: 'm', password: 'p' });
    component.onSubmit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/manager/dashboard']);
  });
});
