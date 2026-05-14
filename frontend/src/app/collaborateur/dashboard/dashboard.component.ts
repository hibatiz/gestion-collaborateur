import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { CollabDashboard } from '../../shared/models/manager.model';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboardData: CollabDashboard | null = null;
  isLoading = true;
  radarChart: any = null;
  lineChart: any = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadCollabAndDashboard();
  }

  ngOnDestroy(): void {
    if (this.radarChart) this.radarChart.destroy();
    if (this.lineChart) this.lineChart.destroy();
  }

  loadCollabAndDashboard(): void {
    this.isLoading = true;
    this.dashboardService.getCurrentCollab().subscribe({
      next: (collab) => {
        if (collab && collab.id) {
          this.loadDashboard(collab.id);
        } else {
          this.isLoading = false;
        }
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur lors de la récupération du profil');
      }
    });
  }

  loadDashboard(id: number): void {
    this.dashboardService.getCollabDashboard(id).subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.isLoading = false;
        setTimeout(() => this.buildCharts(), 0);
      },
      error: () => {
        this.isLoading = false;
        console.error('Erreur chargement dashboard');
      }
    });
  }

  buildCharts(): void {
    if (!this.dashboardData) return;
    this.buildRadarChart();
    this.buildLineChart();
  }

  // ── Couleurs charts adaptées au thème courant ──────────────────────
  private getChartColors() {
    const style = getComputedStyle(document.documentElement);
    return {
      tick:   style.getPropertyValue('--text-secondary').trim() || '#cbd5e1',
      grid:   'rgba(255,255,255,0.06)',
      legend: style.getPropertyValue('--text-secondary').trim() || '#cbd5e1',
    };
  }

  buildRadarChart(): void {
    const categories = ['TECHNIQUE', 'OUTIL', 'METHODOLOGIE', 'LANGUE'];
    const data = categories.map(cat => this.dashboardData!.competencesParCategorie[cat] || 0);
    const { tick } = this.getChartColors();

    if (this.radarChart) this.radarChart.destroy();

    this.radarChart = new Chart('radarChart', {
      type: 'radar',
      data: {
        labels: ['Technique', 'Outil', 'Méthodologie', 'Langue'],
        datasets: [{
          label: 'Mes compétences',
          data: data,
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          borderColor: '#38bdf8',
          pointBackgroundColor: '#38bdf8',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0, color: tick, backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: { color: tick, font: { size: 12 } }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  buildLineChart(): void {
    if (!this.dashboardData || !this.hasEvolutionData()) return;
    if (this.lineChart) this.lineChart.destroy();
    const { tick, grid, legend } = this.getChartColors();

    const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#a78bfa'];

    const datasets = this.dashboardData.evolution
      .filter(e => e.historique.length > 1)
      .slice(0, 5)
      .map((e, i) => ({
        label: e.competenceNom,
        data: e.historique.map(h => ({
          x: new Date(h.dateChangement),
          y: this.getNiveauScore(h.nouveauNiveau)
        })),
        borderColor: colors[i % colors.length],
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 5
      }));

    this.lineChart = new Chart('lineChart', {
      type: 'line',
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'month', displayFormats: { month: 'MMM yyyy' } },
            ticks: { color: tick },
            grid: { color: grid }
          },
          y: {
            min: 0, max: 5,
            ticks: {
              stepSize: 1,
              color: tick,
              callback: (val: any) => ['', 'DEB', 'INT', 'AVA', 'EXP', ''][val] || ''
            },
            grid: { color: grid }
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: legend, padding: 14, boxWidth: 10 }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ctx.dataset.label + ': ' + (['', 'DEB', 'INT', 'AVA', 'EXP'][ctx.parsed.y] || '')
            }
          }
        }
      }
    });
  }

  hasEvolutionData(): boolean {
    return this.dashboardData?.evolution?.some(e => e.historique.length > 1) ?? false;
  }

  getNiveauScore(niveau: string): number {
    const scores: { [key: string]: number } = {
      'DEBUTANT': 1,
      'INTERMEDIAIRE': 2,
      'AVANCE': 3,
      'EXPERT': 4
    };
    return scores[niveau] || 0;
  }

  getNiveauColor(niveau: string): string {
    const colors: { [key: string]: string } = {
      'DEBUTANT': '#94A3B8',
      'INTERMEDIAIRE': '#2E7CF6',
      'AVANCE': '#F59E0B',
      'EXPERT': '#10B981'
    };
    return colors[niveau] || '#CBD5E1';
  }

  getCategoryIcon(cat: string): string {
    const icons: { [key: string]: string } = {
      'TECHNIQUE': '💻',
      'OUTIL': '🔧',
      'METHODOLOGIE': '📋',
      'LANGUE': '🌍'
    };
    return icons[cat] || '⭐';
  }
}
