import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'mao-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private readonly _theme$ = new BehaviorSubject<Theme>(this.loadFromStorage());

  /** Observable du thème courant — abonnez-vous pour réagir aux changements */
  readonly theme$ = this._theme$.asObservable();

  get isDark(): boolean { return this._theme$.value === 'dark'; }
  get isLight(): boolean { return this._theme$.value === 'light'; }

  constructor() {
    // Applique le thème sauvegardé dès l'instanciation du service
    this.applyTheme(this._theme$.value);
  }

  /** Bascule entre dark ↔ light */
  toggle(): void {
    const next: Theme = this.isDark ? 'light' : 'dark';
    this._theme$.next(next);
    this.applyTheme(next);
    this.saveToStorage(next);
  }

  /** Force un thème précis */
  setTheme(theme: Theme): void {
    if (this._theme$.value === theme) return;
    this._theme$.next(theme);
    this.applyTheme(theme);
    this.saveToStorage(theme);
  }

  // ── Privé ───────────────────────────────────────────────────────────

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  }

  private saveToStorage(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* Private/incognito : silently ignore */ }
  }

  private loadFromStorage(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* ignore */ }
    // Respect OS preference as sensible default
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
