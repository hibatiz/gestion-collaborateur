import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, NgZone
} from '@angular/core';
import { ManagerService } from '../manager.service';
import { EnhancedDashboard } from '../../shared/models/manager.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ────────────────────────────────────────────────────────────
// Interfaces
// ────────────────────────────────────────────────────────────

type LineKind = 'event' | 'cmd' | 'output' | 'error' | 'info' | 'search';

interface TerminalLine {
  time:     string;
  tag:      string;
  tagClass: string;
  text:     string;
  kind:     LineKind;
  raw?:     string;   // original input for 'cmd' kind
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('terminalBody')  terminalBody!:  ElementRef<HTMLDivElement>;
  @ViewChild('terminalInput') terminalInput!: ElementRef<HTMLInputElement>;

  stats: EnhancedDashboard | null = null;
  isLoading = true;

  // ── Terminal state ──────────────────────────────────────────
  terminalLines: TerminalLine[] = [];
  cliValue       = '';          // bound to the CLI input
  cmdHistory:    string[] = []; // up-arrow command history
  historyIndex   = -1;
  isFeedPaused   = false;       // paused while user types

  private terminalInterval: any = null;
  private autoEventCursor   = 0;

  // ── Collaborateurs cache (for search command) ────────────────
  private collabNames: string[] = [];

  // ── Charts ──────────────────────────────────────────────────
  private barChart:      any = null;
  private doughnutChart: any = null;
  private avgLevelChart: any = null;

  /** Simulated background event stream */
  private readonly EVENTS: Array<Omit<TerminalLine, 'time' | 'kind'>> = [
    { tag: 'COMPÉTENCE', tagClass: 'tag-cyan',   text: 'Sophie Martin a atteint EXPERT en Angular' },
    { tag: 'PROJET',     tagClass: 'tag-violet',  text: 'Nouveau projet "Refonte API" créé par manager1' },
    { tag: 'PROFIL',     tagClass: 'tag-green',   text: 'Thomas Dupont a mis à jour ses compétences Docker' },
    { tag: 'COMPÉTENCE', tagClass: 'tag-cyan',    text: 'Julie Bernard franchit AVANCÉ en TensorFlow' },
    { tag: 'ÉQUIPE',     tagClass: 'tag-amber',   text: 'Équipe "Data Analytics" constituée (4 membres)' },
    { tag: 'PROFIL',     tagClass: 'tag-green',   text: 'Marc Leroy a complété son profil à 100%' },
    { tag: 'COMPÉTENCE', tagClass: 'tag-cyan',    text: 'Thomas Dupont atteint EXPERT en Kubernetes' },
    { tag: 'ALERTE',     tagClass: 'tag-rose',    text: 'Lacune détectée en Sécurité Cloud (équipe #3)' },
    { tag: 'PROJET',     tagClass: 'tag-violet',  text: 'Projet "Migration GCP" clôturé avec succès' },
    { tag: 'COMPÉTENCE', tagClass: 'tag-cyan',    text: 'Julie Bernard valide EXPERT en Python 3.12' },
  ];

  // ══════════════════════════════════════════════════════════════
  // COMMAND REGISTRY
  // Each entry: command prefix → handler function
  // ══════════════════════════════════════════════════════════════
  private readonly COMMANDS: Record<string, (args: string[]) => void> = {
    help:    ()     => this.cmdHelp(),
    clear:   ()     => this.cmdClear(),
    ping:    (args) => this.cmdPing(args),
    search:  (args) => this.cmdSearch(args),
    stats:   ()     => this.cmdStats(),
    whoami:  ()     => this.cmdWhoami(),
    ls:      ()     => this.cmdLs(),
    history: ()     => this.showHistory(),
    pause:   ()     => this.cmdPause(),
    resume:  ()     => this.cmdResume(),
  };

  constructor(
    private managerService: ManagerService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.startTerminalFeed();
    this.printWelcomeBanner();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.barChart)         this.barChart.destroy();
    if (this.doughnutChart)    this.doughnutChart.destroy();
    if (this.avgLevelChart)    this.avgLevelChart.destroy();
    if (this.terminalInterval) clearInterval(this.terminalInterval);
  }

  // ── Dashboard ───────────────────────────────────────────────
  loadDashboard(): void {
    this.managerService.getEnhancedDashboard().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        // Cache collab names for `search` command
        this.collabNames = (data.collaborateursRecents || [])
          .map((c: any) => `${c.prenom} ${c.nom}`);
        setTimeout(() => this.buildCharts(), 0);
      },
      error: () => { this.isLoading = false; }
    });
  }

  // ════════════════════════════════════════════════════════════
  // TERMINAL – Auto-event feed
  // ════════════════════════════════════════════════════════════

  private startTerminalFeed(): void {
    for (let i = 0; i < 2; i++) this.pushEventLine(i);
    this.autoEventCursor = 2;

    this.terminalInterval = setInterval(() => {
      if (this.isFeedPaused) return;
      this.pushEventLine(this.autoEventCursor % this.EVENTS.length);
      this.autoEventCursor++;
      if (this.terminalLines.length > 200) this.terminalLines.shift();
      this.scrollBottom();
    }, 3000);
  }

  private pushEventLine(index: number): void {
    const ev = this.EVENTS[index % this.EVENTS.length];
    this.terminalLines.push({
      kind:     'event',
      time:     this.nowString(),
      tag:      ev.tag,
      tagClass: ev.tagClass,
      text:     ev.text,
    });
  }

  private printWelcomeBanner(): void {
    const banner: Array<Omit<TerminalLine, 'time'>> = [
      { kind: 'info', tag: 'SYS', tagClass: 'tag-green',
        text: 'MAO Conseil CLI v2.0.0 — Tapez "help" pour la liste des commandes.' },
      { kind: 'info', tag: 'SYS', tagClass: 'tag-green',
        text: 'Utilisation : Entrée pour exécuter · ↑/↓ pour l\'historique.' },
    ];
    banner.forEach(b =>
      this.terminalLines.push({ ...b, time: this.nowString() })
    );
  }

  // ════════════════════════════════════════════════════════════
  // TERMINAL – CLI input handling
  // ════════════════════════════════════════════════════════════

  /** Called on (keydown) from the input field */
  onTerminalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.executeCommand();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateHistory(-1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateHistory(1);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.autocomplete();
    }
  }

  private navigateHistory(direction: number): void {
    if (this.cmdHistory.length === 0) return;
    this.historyIndex = Math.max(
      -1,
      Math.min(this.cmdHistory.length - 1, this.historyIndex + direction)
    );
    this.cliValue = this.historyIndex >= 0
      ? this.cmdHistory[this.cmdHistory.length - 1 - this.historyIndex]
      : '';
  }

  private autocomplete(): void {
    const partial = this.cliValue.trim().toLowerCase();
    const match = Object.keys(this.COMMANDS).find(c => c.startsWith(partial));
    if (match) this.cliValue = match;
  }

  /** Focus terminal input when clicking anywhere on terminal body */
  focusInput(): void {
    this.terminalInput?.nativeElement.focus();
  }

  onInputFocus(): void  { this.isFeedPaused = true; }
  onInputBlur(): void   { this.isFeedPaused = false; }

  private executeCommand(): void {
    const raw = this.cliValue.trim();
    if (!raw) return;

    // Record in history (avoid duplicates)
    if (this.cmdHistory[this.cmdHistory.length - 1] !== raw) {
      this.cmdHistory.push(raw);
      if (this.cmdHistory.length > 50) this.cmdHistory.shift();
    }
    this.historyIndex = -1;

    // Echo the command
    this.terminalLines.push({
      kind: 'cmd',
      time: this.nowString(),
      tag:  'root@mao-conseil:~#',
      tagClass: 'tag-prompt',
      text: raw,
      raw,
    });

    this.cliValue = '';

    // Parse and dispatch
    const parts  = raw.split(/\s+/);
    const cmd    = parts[0].toLowerCase();
    const args   = parts.slice(1);
    const handler = this.COMMANDS[cmd];

    if (handler) {
      handler(args);
    } else {
      this.pushOutput(`Commande inconnue : "${cmd}". Tapez "help" pour l'aide.`, 'error');
    }

    this.scrollBottom();
  }

  // ── Output helpers ───────────────────────────────────────────
  private pushOutput(text: string, kind: LineKind = 'output', tag = 'OUT', tagClass = 'tag-dim'): void {
    this.terminalLines.push({ kind, time: this.nowString(), tag, tagClass, text });
  }

  // ════════════════════════════════════════════════════════════
  // COMMAND IMPLEMENTATIONS
  // ════════════════════════════════════════════════════════════

  private cmdHelp(): void {
    const cmds = [
      ['clear',          'Vide le terminal'],
      ['ping backend',   'Test de latence réseau vers l\'API'],
      ['search [nom]',   'Recherche un collaborateur par nom'],
      ['stats',          'Affiche les statistiques de la plateforme'],
      ['whoami',         'Affiche l\'identité de la session courante'],
      ['ls',             'Liste les modules de l\'application'],
      ['history',        'Affiche l\'historique des commandes'],
      ['pause',          'Suspend le flux d\'événements automatiques'],
      ['resume',         'Reprend le flux d\'événements automatiques'],
    ];
    this.pushOutput('─── Commandes disponibles ───────────────────────', 'info', 'HELP', 'tag-violet');
    cmds.forEach(([name, desc]) =>
      this.pushOutput(`  ${name.padEnd(20)} ${desc}`, 'info', '    ', 'tag-dim')
    );
    this.pushOutput('─────────────────────────────────────────────────', 'info', '    ', 'tag-dim');
  }

  private cmdClear(): void {
    this.terminalLines = [];
    this.pushOutput('Terminal vidé.', 'info', 'SYS', 'tag-green');
  }

  private cmdPing(args: string[]): void {
    const target = args.join(' ') || 'backend';

    this.pushOutput(`PING ${target} (api.mao-conseil.internal)…`, 'info', 'NET', 'tag-cyan');

    // Staggered simulated replies
    const latencies = [
      Math.floor(8  + Math.random() * 12),
      Math.floor(10 + Math.random() * 18),
      Math.floor(9  + Math.random() * 10),
      Math.floor(7  + Math.random() * 15),
    ];

    latencies.forEach((ms, i) => {
      setTimeout(() => {
        const ttl    = 64;
        const status = ms < 20 ? 'tag-green' : ms < 35 ? 'tag-amber' : 'tag-rose';
        this.pushOutput(
          `Reply from API: bytes=32 time=${ms}ms TTL=${ttl}`,
          'output', 'NET', status
        );
        if (i === latencies.length - 1) {
          const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
          const min = Math.min(...latencies);
          const max = Math.max(...latencies);
          this.pushOutput(
            `Statistiques — min: ${min}ms  avg: ${avg}ms  max: ${max}ms  perte: 0%`,
            'info', 'NET', 'tag-cyan'
          );
        }
        this.scrollBottom();
      }, (i + 1) * 320);
    });
  }

  private cmdSearch(args: string[]): void {
    const query = args.join(' ').trim().toLowerCase();
    if (!query) {
      this.pushOutput('Usage : search [nom ou prénom]', 'error', 'ERR', 'tag-rose');
      return;
    }

    // Build search pool from stats + cached collab names
    const pool: string[] = [
      ...this.collabNames,
      // Inject static names so demo works even with small datasets
      'Hiba Tizane', 'Sophie Martin', 'Thomas Dupont',
      'Julie Bernard', 'Marc Leroy', 'Karim Bouali',
      'Emma Rousseau', 'Luc Morel', 'Aïcha Ndiaye',
    ];

    const unique  = [...new Set(pool)];
    const results = unique.filter(n => n.toLowerCase().includes(query));

    if (results.length === 0) {
      this.pushOutput(`Aucun collaborateur trouvé pour "${query}".`, 'search', 'SEARCH', 'tag-amber');
    } else {
      this.pushOutput(`${results.length} résultat(s) pour "${query}" :`, 'search', 'SEARCH', 'tag-cyan');
      results.forEach((r, i) =>
        this.pushOutput(`  [${i + 1}] ${r}`, 'search', '    ', 'tag-dim')
      );
    }
  }

  private cmdStats(): void {
    if (!this.stats) {
      this.pushOutput('Données non disponibles — réessayez dans un instant.', 'error', 'ERR', 'tag-rose');
      return;
    }
    this.pushOutput('─── Statistiques plateforme ──────────────────────', 'info', 'STAT', 'tag-violet');
    this.pushOutput(`  Collaborateurs  : ${this.stats.totalCollaborateurs}`,  'output', '    ', 'tag-dim');
    this.pushOutput(`  Compétences     : ${this.stats.totalCompetences}`,     'output', '    ', 'tag-dim');
    this.pushOutput(`  Experts         : ${this.stats.repartitionNiveaux?.['EXPERT'] ?? 0}`, 'output', '    ', 'tag-dim');
    const topDept = Object.keys(this.stats.repartitionParDepartement || {})[0] ?? 'N/A';
    this.pushOutput(`  Dép. principal  : ${topDept}`,                         'output', '    ', 'tag-dim');
    this.pushOutput('─────────────────────────────────────────────────', 'info', '    ', 'tag-dim');
  }

  private cmdWhoami(): void {
    this.pushOutput('root@mao-conseil — Session Manager  [accès complet]', 'info', 'WHO', 'tag-green');
    this.pushOutput(`Heure serveur : ${new Date().toLocaleString('fr-FR')}`, 'output', '    ', 'tag-dim');
  }

  private cmdLs(): void {
    const modules = [
      'dashboard/    — Vue d\'ensemble KPI & graphiques',
      'collaborateurs/ — Annuaire des collaborateurs',
      'matrice/      — Matrice de compétences + graphe D3',
      'equipe/       — Constitution d\'équipe & Smart Match',
    ];
    this.pushOutput('Modules disponibles :', 'info', 'LS', 'tag-violet');
    modules.forEach(m => this.pushOutput(`  drwxr-xr-x  ${m}`, 'output', '    ', 'tag-dim'));
  }

  private showHistory(): void {
    if (this.cmdHistory.length === 0) {
      this.pushOutput('Historique vide.', 'info', 'HIST', 'tag-dim');
      return;
    }
    this.pushOutput('Historique des commandes :', 'info', 'HIST', 'tag-violet');
    [...this.cmdHistory].reverse().slice(0, 10).forEach((cmd, i) =>
      this.pushOutput(`  ${String(i + 1).padStart(3)}  ${cmd}`, 'output', '    ', 'tag-dim')
    );
  }

  private cmdPause(): void {
    this.isFeedPaused = true;
    this.pushOutput('Flux d\'événements suspendu. Tapez "resume" pour reprendre.', 'info', 'SYS', 'tag-amber');
  }

  private cmdResume(): void {
    this.isFeedPaused = false;
    this.pushOutput('Flux d\'événements repris.', 'info', 'SYS', 'tag-green');
  }

  // ── Utilities ────────────────────────────────────────────────
  private scrollBottom(delay = 30): void {
    setTimeout(() => {
      const el = this.terminalBody?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, delay);
  }

  private nowString(): string {
    const d = new Date();
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
      .map(n => String(n).padStart(2, '0')).join(':');
  }

  // ── Couleurs charts adaptées au thème (lit les tokens CSS en temps réel)
  private getChartColors() {
    const style = getComputedStyle(document.documentElement);
    const textSecondary = style.getPropertyValue('--text-secondary').trim() || '#cbd5e1';
    return {
      tick:   textSecondary,
      legend: textSecondary,
      grid:   'rgba(255,255,255,0.06)',
    };
  }

  // ── Charts (dark-theme-aware colors) ────────────────────────
  buildCharts(): void {
    if (!this.stats) return;
    this.buildTop5Chart();
    this.buildNiveauChart();
    this.buildAvgLevelChart();
  }

  buildTop5Chart(): void {
    if (!this.stats) return;
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.barChart) this.barChart.destroy();
    const { tick, grid } = this.getChartColors();
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.stats.top5Competences.map(c => c.nom),
        datasets: [{
          label: 'Collaborateurs', data: this.stats.top5Competences.map(c => c.count),
          backgroundColor: 'rgba(129,140,248,0.7)', borderColor: 'rgba(129,140,248,1)',
          borderWidth: 1, borderRadius: 6,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, color: tick }, grid: { color: grid } },
          x: { ticks: { color: tick }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  buildNiveauChart(): void {
    if (!this.stats) return;
    const ctx = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.doughnutChart) this.doughnutChart.destroy();
    const { legend } = this.getChartColors();
    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.stats.repartitionNiveaux),
        datasets: [{
          data: Object.values(this.stats.repartitionNiveaux),
          backgroundColor: ['#64748b','#818cf8','#fbbf24','#34d399'],
          borderColor: 'rgba(255,255,255,0.07)', borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: legend, padding: 12, boxWidth: 10, font: { size: 12 } }
          }
        }
      }
    });
  }

  buildAvgLevelChart(): void {
    if (!this.stats) return;
    const ctx = document.getElementById('avgLevelChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.avgLevelChart) this.avgLevelChart.destroy();
    const { tick, grid } = this.getChartColors();
    this.avgLevelChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.stats.evolutionMoyenneNiveaux.map(e => e.competence),
        datasets: [{
          label: 'Niveau Moyen', data: this.stats.evolutionMoyenneNiveaux.map(e => e.moyenne),
          backgroundColor: 'rgba(52,211,153,0.65)', borderColor: '#34d399',
          borderWidth: 1, borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `Moyenne: ${Number(c.raw).toFixed(2)}` } }
        },
        scales: {
          x: { min: 0, max: 4, ticks: { stepSize: 1, color: tick }, grid: { color: grid } },
          y: { ticks: { color: tick }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  getAvatarColor(nom: string): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed'];
    return colors[(nom?.charCodeAt(0) ?? 0) % colors.length];
  }
}
