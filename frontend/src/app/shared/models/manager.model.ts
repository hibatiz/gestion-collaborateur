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

export interface CollabRow {
  collaborateurId: number;
  nom: string;
  prenom: string;
  poste: string;
  photoUrl: string | null;
  niveaux: { [competence: string]: string | null };
}

export interface MatriceData {
  collaborateurs: CollabRow[];
  competences: string[];
}

export interface EquipeRequest {
  projetNom: string;
  collaborateurIds: number[];
  competencesRequises: string[];
}

export interface EquipeDTO {
  projetNom: string;
  membres: CollaborateurSummary[];
  competencesCouvertes: string[];
  competencesManquantes: string[];
  hasGap: boolean;
}

export interface CollaborateurDetail {
  id: number;
  nom: string;
  prenom: string;
  poste: string;
  departement: string;
  anneesExperience: number;
  email: string;
  telephone: string;
  photoUrl: string;
  competences: {
    id: number;
    niveau: string;
    dateAcquisition: string;
    competence: {
      id: number;
      nom: string;
      categorie: string;
    };
  }[];
  projets: {
    id: number;
    nom: string;
    description: string;
    dateDebut: string;
    dateFin: string | null;
    role: string;
    technologies: string;
  }[];
  user: {
    username: string;
    role: string;
  };
}
