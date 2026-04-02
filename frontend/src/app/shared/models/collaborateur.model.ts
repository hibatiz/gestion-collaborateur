export interface Collaborateur {
    id: number;
    nom: string;
    prenom: string;
    poste: string;
    departement: string;
    anneesExperience: number;
    email: string;
    telephone: string;
    photoUrl: string;
    competences: Competence[];
}

export interface Competence {
    id: number;
    nom: string;
    categorie: string;
    niveau: string;
    dateAcquisition: string; 
}

export interface CompetenceRequest {
    nom: string;
    categorie: string;
    niveau: string;
    dateAcquisition?: string;
}

export interface UpdateProfileRequest {
    nom: string;
    prenom: string;
    poste: string;
    departement: string;
    anneesExperience: number;
    email: string;
    telephone: string;
}
