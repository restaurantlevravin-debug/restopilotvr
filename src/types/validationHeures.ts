export type StatutValidationHeures = "EN_COURS" | "A_VALIDER" | "VALIDEE";

export type ValidationHeuresMensuelle = {
  id: string;
  entrepriseId: string;
  mois: string;
  annee: number;
  statut: StatutValidationHeures;
  validePar?: string;
  dateValidation?: string;
  remarques: Record<string, string>;
};

export type LigneSyntheseHeures = {
  utilisateurId: string;
  nom: string;
  poste: string;
  contratHebdomadaire: number;
  heuresPrevuesMinutes: number;
  heuresRealiseesMinutes: number;
  ecartMinutes: number;
  heuresSupplementairesMinutes: number;
  remarque?: string;
};

export type SyntheseHeuresMois = {
  entrepriseId: string;
  mois: number;
  annee: number;
  lignes: LigneSyntheseHeures[];
  totalPrevuMinutes: number;
  totalRealiseMinutes: number;
  totalEcartMinutes: number;
  totalHeuresSupplementairesMinutes: number;
};
