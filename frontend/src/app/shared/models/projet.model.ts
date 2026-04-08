export interface Projet {
  id: number;
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  role: string;
  technologies: string;
  dureeEnMois: number;
  enCours: boolean;
}

export interface ProjetRequest {
  nom: string;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  role: string;
  technologies: string;
}
