import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../auth.service';

/**
 * LoginComponent – V3
 *
 * Left panel  : Three.js animated glass-sphere + torus rings + particle field.
 *               Falls back to a 2-D canvas animation if three is not installed.
 *
 * Right panel : Reactive form wired to AuthService.login() → real HTTP call to
 *               Spring Boot backend, redirects on success, shows shaking error
 *               alert on failure. No mocking, no bypass.
 *
 * Form fix    : onSubmit() now extracts field values explicitly as non-null
 *               strings so the LoginRequest payload is always well-formed.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-8px)' }),
        animate('220ms cubic-bezier(0.16,1,0.3,1)',
          style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('160ms ease-in',
          style({ opacity: 0, transform: 'translateY(-4px)' })),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {

  // ── Three.js canvas ──────────────────────────────────
  @ViewChild('threeCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // ── Reactive Form ────────────────────────────────────
  loginForm!: FormGroup;

  // ── UI state ─────────────────────────────────────────
  isLoading          = false;
  errorMessage: string | null = null;
  showPassword       = false;
  /** Controls the shake animation — reset after 650 ms so it re-fires next time. */
  hasError           = false;
  /** Shows the «contact your admin» hint when user clicks «Forgot password». */
  showForgotMessage  = false;

  // ── Three.js private handles ─────────────────────────
  private animationFrameId: number | null = null;
  private threeRenderer:    any = null;
  private threeScene:       any = null;
  private threeCamera:      any = null;
  private sphereMesh:       any = null;
  private ringMesh:         any = null;
  private particlesMesh:    any = null;
  private clock:            any = null;

  constructor(
    private fb:      FormBuilder,
    private authSvc: AuthService,
    private router:  Router,
    private ngZone:  NgZone,
    private cdr:     ChangeDetectorRef,
  ) {}

  // ── Lifecycle ─────────────────────────────────────────

  ngOnInit(): void {
    // Redirect immediately if a valid session already exists
    if (this.authSvc.isAuthenticated()) {
      this.redirectUser(this.authSvc.getRole());
      return;
    }

    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  ngAfterViewInit(): void {
    // Run outside Angular change-detection for peak animation performance
    this.ngZone.runOutsideAngular(() => this.initThreeJS());
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.threeRenderer) {
      this.threeRenderer.dispose();
    }
  }

  // ── Form helpers ──────────────────────────────────────

  /** Shortcut accessor for template validation checks */
  get f() { return this.loginForm.controls; }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * onSubmit – main authentication flow.
   *
   * 1. Validate form (mark fields touched so inline errors appear).
   * 2. Call AuthService.login() which POSTs to the Spring Boot backend.
   * 3. On success  → save JWT via TokenService (done inside AuthService) and redirect.
   * 4. On failure  → display the backend error message with a shake animation.
   */
  onSubmit(): void {
    this.errorMessage     = null;
    this.hasError         = false;
    this.showForgotMessage = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    // ── Extract values explicitly so the payload is always a well-formed
    //    LoginRequest (never null, even under strict null-checks).
    const payload = {
      username: (this.loginForm.get('username')?.value as string).trim(),
      password: (this.loginForm.get('password')?.value as string),
    };

    this.authSvc.login(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.redirectUser(res.role);
      },
      error: (err) => {
        this.isLoading = false;

        // Prefer a specific backend message, fall back to a generic one
        this.errorMessage =
          err.error?.message ||
          err.error?.error   ||
          'Identifiants incorrects. Veuillez réessayer.';

        // Trigger shake – reset after 650 ms so it can re-fire on the next attempt
        this.hasError = true;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.hasError = false;
          this.cdr.detectChanges();
        }, 650);
      },
    });
  }

  /** Toggles the «contact your admin» hint under the forgot-password link. */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.showForgotMessage = !this.showForgotMessage;
  }

  private redirectUser(role: string | null): void {
    switch (role) {
      case 'COLLABORATEUR':
        this.router.navigate(['/collab/profil']);
        break;
      case 'MANAGER':
        this.router.navigate(['/manager/dashboard']);
        break;
      default:
        // Unknown role – stay on login (shouldn't happen with correct backend)
        this.router.navigate(['/login']);
    }
  }

  // ══════════════════════════════════════════════════════
  // THREE.JS – glass sphere + orbiting torus rings
  // ══════════════════════════════════════════════════════

  private async initThreeJS(): Promise<void> {
    try {
      const THREE = await import('three');
      this.setupScene(THREE);
    } catch {
      console.info(
        '[LoginComponent] three.js not found — using CSS fallback.\n' +
        'Run: npm install three   (inside the frontend directory)'
      );
      this.fallbackCanvasAnimation();
    }
  }

  private setupScene(THREE: any): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;

    // ── Renderer ──────────────────────────────────────
    this.threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.setSize(parent.clientWidth, parent.clientHeight);
    this.threeRenderer.setClearColor(0x000000, 0);
    this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.threeRenderer.toneMappingExposure = 1.2;

    // ── Scene & Camera ────────────────────────────────
    this.threeScene  = new THREE.Scene();
    this.threeCamera = new THREE.PerspectiveCamera(
      50, parent.clientWidth / parent.clientHeight, 0.1, 100
    );
    this.threeCamera.position.set(0, 0, 6);

    // ── Lights ────────────────────────────────────────
    this.threeScene.add(new THREE.AmbientLight(0xffffff, 0.1));

    const pl1 = new THREE.PointLight(0x818cf8, 60, 20);
    pl1.position.set(3, 3, 3);
    this.threeScene.add(pl1);

    const pl2 = new THREE.PointLight(0x38bdf8, 40, 20);
    pl2.position.set(-3, -2, 2);
    this.threeScene.add(pl2);

    const pl3 = new THREE.PointLight(0x34d399, 20, 15);
    pl3.position.set(0, -4, -1);
    this.threeScene.add(pl3);

    // ── Glass sphere ──────────────────────────────────
    const sphereGeo = new THREE.SphereGeometry(1.5, 64, 64);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color:          0x1a1f3c,
      metalness:      0.0,
      roughness:      0.05,
      transmission:   0.92,
      thickness:      1.5,
      ior:            1.5,
      reflectivity:   0.9,
      iridescence:    0.6,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 400],
      envMapIntensity: 1.5,
      transparent:    true,
      opacity:        0.85,
    });
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.threeScene.add(this.sphereMesh);

    // ── Torus ring 1 (violet) ─────────────────────────
    const torusMat1 = new THREE.MeshBasicMaterial({ color: 0x818cf8, transparent: true, opacity: 0.7 });
    this.ringMesh   = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.04, 16, 100), torusMat1);
    this.ringMesh.rotation.x = Math.PI / 4;
    this.threeScene.add(this.ringMesh);

    // ── Torus ring 2 (cyan) ───────────────────────────
    const torusMat2 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
    const ringMesh2 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.025, 16, 100), torusMat2);
    ringMesh2.rotation.x = Math.PI / 6;
    ringMesh2.rotation.y = Math.PI / 3;
    this.threeScene.add(ringMesh2);

    // ── Particle field ────────────────────────────────
    const count     = 800;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20;
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlesMesh = new THREE.Points(
      pgeo,
      new THREE.PointsMaterial({ color: 0x818cf8, size: 0.03, transparent: true, opacity: 0.6, sizeAttenuation: true })
    );
    this.threeScene.add(this.particlesMesh);

    this.clock = new THREE.Clock();

    // ── Resize observer ───────────────────────────────
    new ResizeObserver(() => {
      this.threeRenderer.setSize(parent.clientWidth, parent.clientHeight);
      this.threeCamera.aspect = parent.clientWidth / parent.clientHeight;
      this.threeCamera.updateProjectionMatrix();
    }).observe(parent);

    // ── Mouse parallax ────────────────────────────────
    let mx = 0, my = 0;
    document.addEventListener('mousemove', (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // ── Render loop ───────────────────────────────────
    const loop = () => {
      this.animationFrameId = requestAnimationFrame(loop);
      const t = this.clock.getElapsedTime();

      this.sphereMesh.rotation.y = t * 0.18;
      this.sphereMesh.rotation.x = t * 0.06;
      this.sphereMesh.scale.setScalar(1 + Math.sin(t * 0.9) * 0.025);

      this.ringMesh.rotation.z = t * 0.35;
      ringMesh2.rotation.x     = Math.PI / 6 + t * 0.22;

      this.particlesMesh.rotation.y = t * 0.04;

      this.threeCamera.position.x += (mx * 0.5 - this.threeCamera.position.x) * 0.04;
      this.threeCamera.position.y += (-my * 0.5 - this.threeCamera.position.y) * 0.04;
      this.threeCamera.lookAt(this.threeScene.position);

      this.threeRenderer.render(this.threeScene, this.threeCamera);
    };
    loop();
  }

  // ── 2-D canvas fallback ───────────────────────────────
  private fallbackCanvasAnimation(): void {
    const canvas = this.canvasRef.nativeElement;
    const parent = canvas.parentElement!;
    canvas.width  = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blobs = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 80 + Math.random() * 120,
      s: 0.4 + Math.random() * 0.6,
      h: 240 + Math.random() * 60,
    }));

    let t = 0;
    const draw = () => {
      this.animationFrameId = requestAnimationFrame(draw);
      t += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      blobs.forEach((b, i) => {
        const x = b.x + Math.sin(t * b.s + i) * 60;
        const y = b.y + Math.cos(t * b.s * 0.7 + i) * 40;
        const g = ctx.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, `hsla(${b.h},80%,65%,0.18)`);
        g.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });
    };
    draw();
  }
}
