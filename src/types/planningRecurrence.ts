import type { JourPlanning } from "@/types/planning";

export type JourSemainePlanning =
  | "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche";

export type PlanningRecurrence = {
  id: string;
  entrepriseId: string;
  utilisateurId: string;
  poste: string;
  semaine: Partial<Record<JourSemainePlanning, JourPlanning>>;
  actif: boolean;
};

export type ExceptionPlanning = {
  date: string;
  utilisateurId: string;
  type: "CONGE" | "ARRET" | "RECUPERATION" | "MODIFICATION_HORAIRE" | "AUTRE";
  commentaire?: string;
};

export const JOURS_SEMAINE_PLANNING: JourSemainePlanning[] = [
  "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche",
];
