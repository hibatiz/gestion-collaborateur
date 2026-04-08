export interface CollaborateurSummary {
  id: number;
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  anneesExperience: number;
  email: string;
  photoUrl: string | null;
  competencesCount: number;
  projetsCount: number;
  topCompetences: string[];
}

export interface PagedResponse<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface DashboardStats {
  totalCollaborateurs: number;
  totalCompetences: number;
  repartitionParDepartement: { [key: string]: number };
  top5Competences: { nom: string; count: number }[];
  repartitionNiveaux: { [key: string]: number };
  collaborateursRecents: CollaborateurSummary[];
}

export interface SearchParams {
  nom?: string;
  competence?: string;
  niveau?: string;
  departement?: string;
}
