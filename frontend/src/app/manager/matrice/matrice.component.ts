import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild
} from '@angular/core';
import { ManagerService } from '../manager.service';
import { MatriceData, CollabRow } from '../../shared/models/manager.model';
import * as d3 from 'd3';

// ExcelJS loaded lazily (heavy lib ~600 KB)
declare const require: any;

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

  // ════════════════════════════════════════════════════════════
  // FEATURE B – ExcelJS styled export (100% client-side)
  // ════════════════════════════════════════════════════════════
  async exportExcel(): Promise<void> {
    if (!this.matrice) return;
    this.exportingFormat = 'xlsx';

    try {
      // ── Lazy-load ExcelJS to keep initial bundle small ────────
      const ExcelJS = await import('exceljs');
      const workbook  = new ExcelJS.Workbook();
      workbook.creator  = 'MAO Conseils – RH Platform';
      workbook.created  = new Date();

      const ws = workbook.addWorksheet('Matrice Compétences', {
        views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }]
      });

      // ── Color palette ─────────────────────────────────────────
      const COLORS = {
        headerBg:    '0B1120',   // bleu nuit profond
        headerText:  'F1F5F9',
        collabBg:    '111827',
        collabText:  'E2E8F0',
        expert:      { bg: '064E3B', font: '34D399', label: 'EXPERT' },
        avance:      { bg: '2E1065', font: 'A78BFA', label: 'AVANCÉ' },
        intermediaire: { bg: '0C4A6E', font: '38BDF8', label: 'INTER' },
        debutant:    { bg: '1E293B', font: '94A3B8', label: 'DEB'   },
        empty:       { bg: '0F172A', font: '334155', label: ''      },
        rowAlt:      '0D1A2E',
      };

      const makeFill = (hex: string) => ({
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF' + hex }
      });

      const boldFont  = (hex: string, size = 10) =>
        ({ name: 'Calibri', size, bold: true,  color: { argb: 'FF' + hex } });
      const normalFont = (hex: string, size = 9) =>
        ({ name: 'Calibri', size, bold: false, color: { argb: 'FF' + hex } });

      const thinBorder = {
        top:    { style: 'thin' as const, color: { argb: 'FF1E293B' } },
        left:   { style: 'thin' as const, color: { argb: 'FF1E293B' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF1E293B' } },
        right:  { style: 'thin' as const, color: { argb: 'FF1E293B' } },
      };

      // ── Column widths ─────────────────────────────────────────
      const comps = this.matrice.competences;
      ws.getColumn(1).width = 26;
      for (let i = 0; i < comps.length; i++) {
        ws.getColumn(i + 2).width = Math.max(10, comps[i].length + 2);
      }

      // ── Row 1 : Header ───────────────────────────────────────
      const headerRow = ws.getRow(1);
      headerRow.height = 32;

      // Col A header
      const cellA1 = ws.getCell('A1');
      cellA1.value  = '🎯 Collaborateur';
      cellA1.font   = boldFont(COLORS.headerText, 11);
      cellA1.fill   = makeFill(COLORS.headerBg);
      cellA1.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      cellA1.border = thinBorder;

      // Competence headers
      comps.forEach((comp, i) => {
        const cell = headerRow.getCell(i + 2);
        cell.value  = comp;
        cell.font   = boldFont(COLORS.headerText, 10);
        cell.fill   = makeFill(COLORS.headerBg);
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = thinBorder;
      });

      // ── Data rows ────────────────────────────────────────────
      this.matrice.collaborateurs.forEach((row: CollabRow, rowIdx: number) => {
        const dataRow   = ws.getRow(rowIdx + 2);
        dataRow.height  = 24;
        const isAlt     = rowIdx % 2 === 1;

        // Collaborateur cell
        const collabCell = dataRow.getCell(1);
        collabCell.value  = `${row.prenom} ${row.nom}  •  ${row.poste}`;
        collabCell.font   = boldFont(COLORS.collabText, 10);
        collabCell.fill   = makeFill(isAlt ? COLORS.rowAlt : COLORS.collabBg);
        collabCell.alignment = { vertical: 'middle', horizontal: 'left' };
        collabCell.border = thinBorder;

        // Level cells
        comps.forEach((comp, colIdx) => {
          const niveau  = row.niveaux[comp] as string | null;
          const cell    = dataRow.getCell(colIdx + 2);
          const palette = this.getExcelNiveauPalette(niveau, COLORS);

          cell.value  = palette.label;
          cell.font   = boldFont(palette.font, 9);
          cell.fill   = makeFill(palette.bg);
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = thinBorder;
        });
      });

      // ── Footer legend row ────────────────────────────────────
      const legendRowIdx = this.matrice.collaborateurs.length + 3;
      const legendRow    = ws.getRow(legendRowIdx);
      legendRow.height   = 18;

      const legends = [
        { label: 'EXP = Expert',        bg: COLORS.expert.bg,        font: COLORS.expert.font },
        { label: 'AVA = Avancé',         bg: COLORS.avance.bg,        font: COLORS.avance.font },
        { label: 'INT = Intermédiaire',  bg: COLORS.intermediaire.bg, font: COLORS.intermediaire.font },
        { label: 'DEB = Débutant',       bg: COLORS.debutant.bg,      font: COLORS.debutant.font },
      ];
      legends.forEach((leg, i) => {
        const c = legendRow.getCell(i + 2);
        c.value  = leg.label;
        c.font   = boldFont(leg.font, 8);
        c.fill   = makeFill(leg.bg);
        c.alignment = { vertical: 'middle', horizontal: 'center' };
        c.border = thinBorder;
      });

      // ── Download ─────────────────────────────────────────────
      const buffer  = await workbook.xlsx.writeBuffer();
      const blob    = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Matrice_Competences_MAO_${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('[Excel Export]', err);
    } finally {
      this.exportingFormat = null;
    }
  }

  /** Map niveau string → ExcelJS color palette */
  private getExcelNiveauPalette(
    niveau: string | null,
    C: any
  ): { bg: string; font: string; label: string } {
    switch (niveau) {
      case 'EXPERT':        return C.expert;
      case 'AVANCE':        return C.avance;
      case 'INTERMEDIAIRE': return C.intermediaire;
      case 'DEBUTANT':      return C.debutant;
      default:              return C.empty;
    }
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
