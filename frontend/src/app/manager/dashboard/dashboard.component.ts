import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ManagerService } from '../manager.service';
import { DashboardStats } from '../../shared/models/manager.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats: DashboardStats | null = null;
  isLoading = true;
  
  private barChart: any = null;
  private doughnutChart: any = null;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    // We will build charts once data is loaded
  }

  loadDashboard(): void {
    this.managerService.getDashboard().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        // Small delay to ensure canvas is in DOM
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

    // Bar Chart: Top 5 Competences
    const ctxBar = document.getElementById('barChart') as HTMLCanvasElement;
    if (ctxBar) {
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
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    }

    // Doughnut Chart: Niveau distribution
    const ctxDoughnut = document.getElementById('doughnutChart') as HTMLCanvasElement;
    if (ctxDoughnut) {
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
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }
  }

  getAvatarColor(nom: string): string {
    const colors = ['#1B2A4A','#2E7CF6','#10B981','#F59E0B','#EF4444','#8B5CF6'];
    const index = nom ? nom.charCodeAt(0) % colors.length : 0;
    return colors[index];
  }
}
