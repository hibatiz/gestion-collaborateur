import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild
} from '@angular/core';
import { ManagerService } from '../manager.service';
import { MatriceData, CollabRow } from '../../shared/models/manager.model';
import * as d3 from 'd3';

interface GraphNode extends d3.SimulationNodeDatum {
  id:    string;
  label: string;
  type:  'collab' | 'skill';
  color?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  niveau?: string;
}

@Component({
  selector: 'app-matrice',
  templateUrl: './matrice.component.html',
  styleUrls: ['./matrice.component.scss']
})
export class MatriceComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('graphCanvas') graphCanvas!: ElementRef<SVGElement>;

  matrice: MatriceData | null = null;
  isLoading    = true;
  isExporting  = false;
  filterText   = '';
  exportingFormat: 'pdf' | 'xlsx' | null = null;

  /** Toggle between table view and D3 graph view */
  viewMode: 'table' | 'graph' = 'table';

  private simulation: any = null;
  private svg:        any = null;

  constructor(private managerService: ManagerService) {}

  ngOnInit(): void {
    this.managerService.getMatrice().subscribe({
      next: (data) => {
        this.matrice = data;
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.simulation) this.simulation.stop();
  }

  // ── View toggle ────────────────────────────────────────────
  switchView(mode: 'table' | 'graph'): void {
    this.viewMode = mode;
    if (mode === 'graph') {
      setTimeout(() => this.buildGraph(), 100);
    } else {
      this.clearGraph();
    }
  }

  // ════════════════════════════════════════════════════════════
  // FEATURE A – D3.js Network Graph
  // ════════════════════════════════════════════════════════════

  buildGraph(): void {
    if (!this.matrice || !this.graphCanvas) return;
    this.clearGraph();

    const host   = this.graphCanvas.nativeElement.parentElement!;
    const W      = host.clientWidth  || 800;
    const H      = host.clientHeight || 540;

    // ── Build nodes & links ──────────────────────────────────
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const skillSet = new Set<string>();

    const COLLAB_COLORS = ['#818cf8','#38bdf8','#34d399','#fbbf24','#f87171','#a78bfa'];

    this.matrice.collaborateurs.forEach((row: CollabRow, i: number) => {
      const cId = `collab-${row.nom}-${row.prenom}`;
      nodes.push({
        id:    cId,
        label: `${row.prenom[0]}. ${row.nom}`,
        type:  'collab',
        color: COLLAB_COLORS[i % COLLAB_COLORS.length],
      });

      Object.entries(row.niveaux).forEach(([skill, niveau]) => {
        if (!niveau) return;
        const sId = `skill-${skill}`;
        if (!skillSet.has(sId)) {
          skillSet.add(sId);
          nodes.push({ id: sId, label: skill, type: 'skill' });
        }
        links.push({ source: cId, target: sId, niveau: niveau as string });
      });
    });

    // ── SVG setup ────────────────────────────────────────────
    this.svg = d3.select(this.graphCanvas.nativeElement)
      .attr('width',  W)
      .attr('height', H);

    // Defs: arrow marker
    const defs = this.svg.append('defs');
    defs.append('filter')
      .attr('id', 'glow-filter')
      .html(`
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      `);

    // ── Force simulation ─────────────────────────────────────
    this.simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link',   d3.forceLink<GraphNode, GraphLink>(links)
                         .id(d => d.id).distance(90).strength(0.6))
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(32));

    // ── Links ────────────────────────────────────────────────
    const linkEl = this.svg.append('g').attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: GraphLink) => {
        const n: any = d.niveau;
        return n === 'EXPERT' ? '#34d399' : n === 'AVANCE' ? '#818cf8' : n === 'INTERMEDIAIRE' ? '#38bdf8' : '#475569';
      })
      .attr('stroke-width', (d: GraphLink) => {
        const n: any = d.niveau;
        return n === 'EXPERT' ? 2.5 : n === 'AVANCE' ? 2 : 1.5;
      })
      .attr('stroke-opacity', 0.55);

    // ── Collab nodes ─────────────────────────────────────────
    const nodeEl = this.svg.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', (d: GraphNode) => `node node-${d.type}`)
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event: any, d: GraphNode) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag',  (event: any, d: GraphNode) => { d.fx = event.x; d.fy = event.y; })
          .on('end',   (event: any, d: GraphNode) => {
            if (!event.active) this.simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    // Collab circles
    nodeEl.filter((d: GraphNode) => d.type === 'collab')
      .append('circle')
      .attr('r', 22)
      .attr('fill', (d: GraphNode) => d.color || '#818cf8')
      .attr('stroke', '#ffffff22')
      .attr('stroke-width', 2)
      .style('filter', 'url(#glow-filter)');

    // Skill diamonds (rect rotated 45°)
    nodeEl.filter((d: GraphNode) => d.type === 'skill')
      .append('rect')
      .attr('width', 18).attr('height', 18)
      .attr('x', -9).attr('y', -9)
      .attr('rx', 3)
      .attr('transform', 'rotate(45)')
      .attr('fill', 'rgba(56,189,248,0.15)')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5);

    // Labels
    nodeEl.append('text')
      .attr('dy', (d: GraphNode) => d.type === 'collab' ? 36 : 20)
      .attr('text-anchor', 'middle')
      .attr('fill', (d: GraphNode) => d.type === 'collab' ? '#f1f5f9' : '#94a3b8')
      .attr('font-size', (d: GraphNode) => d.type === 'collab' ? 11 : 10)
      .attr('font-family', "'Fira Code', monospace")
      .text((d: GraphNode) => d.label);

    // ── Hover interactions: neon glow on skill hover ──────────
    nodeEl.filter((d: GraphNode) => d.type === 'skill')
      .on('mouseenter', (event: MouseEvent, hoveredSkill: GraphNode) => {
        // Highlight connected collabs
        linkEl.attr('stroke-opacity', (l: GraphLink) => {
          const src = (l.source as GraphNode).id;
          const tgt = (l.target as GraphNode).id;
          return tgt === hoveredSkill.id || src === hoveredSkill.id ? 1 : 0.08;
        });
        nodeEl.filter((d: GraphNode) => d.type === 'collab')
          .select('circle')
          .attr('stroke', (d: GraphNode) => {
            const linked = links.some(l =>
              ((l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id) &&
              ((l.source as GraphNode).id === hoveredSkill.id || (l.target as GraphNode).id === hoveredSkill.id)
            );
            return linked ? '#38bdf8' : '#ffffff22';
          })
          .attr('stroke-width', (d: GraphNode) => {
            const linked = links.some(l =>
              ((l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id) &&
              ((l.source as GraphNode).id === hoveredSkill.id || (l.target as GraphNode).id === hoveredSkill.id)
            );
            return linked ? 4 : 2;
          })
          .style('filter', (d: GraphNode) => {
            const linked = links.some(l =>
              ((l.source as GraphNode).id === d.id || (l.target as GraphNode).id === d.id) &&
              ((l.source as GraphNode).id === hoveredSkill.id || (l.target as GraphNode).id === hoveredSkill.id)
            );
            return linked ? 'drop-shadow(0 0 10px #38bdf8) url(#glow-filter)' : 'url(#glow-filter)';
          });
      })
      .on('mouseleave', () => {
        linkEl.attr('stroke-opacity', 0.55);
        nodeEl.filter((d: GraphNode) => d.type === 'collab')
          .select('circle')
          .attr('stroke', '#ffffff22')
          .attr('stroke-width', 2)
          .style('filter', 'url(#glow-filter)');
      });

    // ── Tick ─────────────────────────────────────────────────
    this.simulation.on('tick', () => {
      linkEl
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      nodeEl
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
  }

  private clearGraph(): void {
    if (this.simulation) { this.simulation.stop(); this.simulation = null; }
    if (this.svg) { this.svg.selectAll('*').remove(); this.svg = null; }
  }

  // ── Table helpers ───────────────────────────────────────────
  get filteredCompetences(): string[] {
    if (!this.filterText.trim()) return this.matrice?.competences || [];
    return this.matrice?.competences.filter(c =>
      c.toLowerCase().includes(this.filterText.toLowerCase())) || [];
  }

  get filteredRows(): CollabRow[] {
    return this.matrice?.collaborateurs || [];
  }

  exportPdf(): void {
    this.exportingFormat = 'pdf';
    this.managerService.exportMatrice('pdf').subscribe({
      next: (blob) => { this.managerService.triggerDownload(blob, 'matrice_competences.pdf'); this.exportingFormat = null; },
      error: () => this.exportingFormat = null
    });
  }

  exportExcel(): void {
    this.exportingFormat = 'xlsx';
    this.managerService.exportMatrice('xlsx').subscribe({
      next: (blob) => { this.managerService.triggerDownload(blob, 'matrice_competences.xlsx'); this.exportingFormat = null; },
      error: () => this.exportingFormat = null
    });
  }

  getNiveauClass(niveau: string | null): string {
    if (!niveau) return 'cell-empty';
    const map: any = { DEBUTANT: 'cell-debutant', INTERMEDIAIRE: 'cell-inter', AVANCE: 'cell-avance', EXPERT: 'cell-expert' };
    return map[niveau] || 'cell-empty';
  }

  getNiveauLabel(niveau: string | null): string {
    if (!niveau) return '';
    const map: any = { DEBUTANT: 'DEB', INTERMEDIAIRE: 'INT', AVANCE: 'AVA', EXPERT: 'EXP' };
    return map[niveau] || '';
  }

  getAvatarColor(nom: string): string {
    const colors = ['#4f46e5','#0891b2','#059669','#d97706','#dc2626','#7c3aed'];
    return colors[(nom?.charCodeAt(0) ?? 0) % colors.length];
  }
}
