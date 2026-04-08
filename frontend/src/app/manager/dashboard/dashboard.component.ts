import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ManagerService } from '../manager.service';
import { EnhancedDashboard } from '../../shared/models/manager.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: EnhancedDashboard | null = null;
  isLoading = true;
  
  private barChart: any = null;
  private doughnutChart: any = null;
  private avgLevelChart: any = null;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.barChart) this.barChart.destroy();
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (this.avgLevelChart) this.avgLevelChart.destroy();
  }

  loadDashboard(): void {
    this.managerService.getEnhancedDashboard().subscribe({
      next: (data) => {
        this.stats = data;
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
    if (!this.stats) return;

    this.buildTop5Chart();
    this.buildNiveauChart();
    this.buildAvgLevelChart();
  }

  buildTop5Chart(): void {
    if (!this.stats) return;
    const ctxBar = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctxBar) return;
    if (this.barChart) this.barChart.destroy();
    this.barChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: this.stats.top5Competences.map(c => c.nom),
        datasets: [{
          label: 'Collaborateurs',
          data: this.stats.top5Competences.map(c => c.count),
          backgroundColor: '#2E7CF6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });
  }

  buildNiveauChart(): void {
    if (!this.stats) return;
    const ctxDoughnut = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (!ctxDoughnut) return;
    if (this.doughnutChart) this.doughnutChart.destroy();
    this.doughnutChart = new Chart(ctxDoughnut, {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.stats.repartitionNiveaux),
        datasets: [{
          data: Object.values(this.stats.repartitionNiveaux),
          backgroundColor: ['#94A3B8', '#2E7CF6', '#F59E0B', '#10B981']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  buildAvgLevelChart(): void {
    if (!this.stats) return;
    const ctxAvg = document.getElementById('avgLevelChart') as HTMLCanvasElement;
    if (!ctxAvg) return;
    if (this.avgLevelChart) this.avgLevelChart.destroy();
    
    this.avgLevelChart = new Chart(ctxAvg, {
      type: 'bar',
      data: {
        labels: this.stats.evolutionMoyenneNiveaux.map(e => e.competence),
        datasets: [{
          label: 'Niveau Moyen (Score 1-4)',
          data: this.stats.evolutionMoyenneNiveaux.map(e => e.moyenne),
          backgroundColor: '#10B981',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `Moyenne: ${Number(ctx.raw).toFixed(2)}`
            }
          }
        },
        scales: {
          x: { min: 0, max: 4, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A','#2E7CF6','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    const index = nom ? nom.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }
}
