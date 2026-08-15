export type RemarquePlanning =
  | "Congé payé"
  | "Arrêt travail"
  | "Récupération"
  | "Heure supplémentaire"
  | "Repos"
  | "Absence exceptionnelle"
  | "Autre";

export const REMARQUES_PLANNING: RemarquePlanning[] = [
  "Congé payé", "Arrêt travail", "Récupération", "Heure supplémentaire", "Repos", "Absence exceptionnelle", "Autre",
];

export type PeriodeTravail = { heureDebut: string; heureFin: string };

export type JourPlanning = {
  date: string;
  matin: PeriodeTravail;
  soir: PeriodeTravail;
  remarque?: RemarquePlanning;
  remarqueLibre?: string;
};

export type LignePlanningMensuel = {
  utilisateurId: string;
  nom: string;
  poste: string;
  heuresContratHebdomadaires: number;
  jours: JourPlanning[];
};

export type PlanningMensuel = {
  id: string;
  entrepriseId: string;
  mois: number;
  annee: number;
  statut: "BROUILLON" | "VALIDE";
  lignes: LignePlanningMensuel[];
  dateValidation?: string;
};

export type CalculHeuresPlanning = {
  heuresPrevues: number;
  heuresCalculees: number;
  heuresContratMensuelles: number;
  ecartContrat: number;
};

export type ComparaisonPlanningPointage = {
  utilisateurId: string;
  heuresPlanning: number;
  heuresPointage?: number;
  ecartPrevuRealise?: number;
};
