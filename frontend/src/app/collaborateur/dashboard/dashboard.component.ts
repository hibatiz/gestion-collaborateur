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

  buildRadarChart(): void {
    const categories = ['TECHNIQUE', 'OUTIL', 'METHODOLOGIE', 'LANGUE'];
    const data = categories.map(cat => this.dashboardData!.competencesParCategorie[cat] || 0);

    if (this.radarChart) this.radarChart.destroy();
    
    this.radarChart = new Chart('radarChart', {
      type: 'radar',
      data: {
        labels: ['Technique', 'Outil', 'Méthodologie', 'Langue'],
        datasets: [{
          label: 'Mes compétences',
          data: data,
          backgroundColor: 'rgba(46, 124, 246, 0.2)',
          borderColor: '#2E7CF6',
          pointBackgroundColor: '#2E7CF6',
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            ticks: { stepSize: 1, precision: 0 },
            grid: { color: '#E2E8F0' }
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

    const colors = ['#2E7CF6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#1B2A4A'];
    
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
            grid: { color: '#F1F5F9' }
          },
          y: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
              callback: (val: any) => ['', 'DEB', 'INT', 'AVA', 'EXP', ''][val] || ''
            },
            grid: { color: '#F1F5F9' }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
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
