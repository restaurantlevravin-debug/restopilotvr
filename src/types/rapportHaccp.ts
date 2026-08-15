export type RapportHaccp = {
  id: string;
  entrepriseId: string;
  periode: { debut: string; fin: string };
  statistiques: {
    nombreControles: number;
    controlesConformes: number;
    tauxConformite: number;
    nombreAnomalies: number;
    anomaliesResolues: number;
    anomaliesOuvertes: number;
    actionsCorrectives: number;
  };
  pointsControle: {
    nom: string;
    nombrePassages: number;
    conformite: number;
  }[];
  validations: {
    utilisateurId: string;
    role: string;
    nombreValidations: number;
  }[];
  generationDate: string;
};

export type SyntheseEntrepriseHaccp = {
  nombreControles: number;
  tauxConformite: number;
  anomaliesTraitees: number;
  anomaliesOuvertes: number;
  tempsMoyenResolutionJours: number;
  niveauEquipe: string;
};

export type LigneHistoriqueHaccp = {
  id: string;
  date: string;
  heure: string;
  controle: string;
  resultat: string;
  utilisateurId: string;
  validation: string;
  conforme: boolean;
};
