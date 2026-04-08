import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showPassword = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.redirectUser(this.authService.getRole());
    }

    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Identifiants incorrects';
      }
    });
  }

  private redirectUser(role: string | null): void {
    if (role === 'COLLABORATEUR') {
      this.router.navigate(['/collab/profil']);
    } else if (role === 'MANAGER') {
      this.router.navigate(['/manager/dashboard']);
    } else {
      this.router.navigate(['/login']); // Fallback
    }
  }
}
