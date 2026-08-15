export type StatutAnomalieHaccp = "OUVERTE" | "EN_TRAITEMENT" | "VALIDEE" | "CLOTUREE";
export type PrioriteAnomalieHaccp = "NORMALE" | "IMPORTANTE" | "CRITIQUE";

export type AnomalieHaccp = {
  id: string;
  entrepriseId: string;
  controleId: string;
  utilisateurDeclarationId: string;
  dateCreation: string;
  heureCreation: string;
  type: string;
  description: string;
  photo: string;
  actionCorrective?: string;
  responsableValidationId?: string;
  dateValidation?: string;
  dateCloture?: string;
  statut: StatutAnomalieHaccp;
  priorite: PrioriteAnomalieHaccp;
};

export const RECOMPENSE_GARDIEN_CONFORMITE = {
  id: "gardien-conformite",
  nom: "Gardien de la conformité",
  active: false,
} as const;

export const BONUS_EQUIPE_SEMAINE_SANS_ANOMALIE = {
  id: "semaine-sans-anomalie-ouverte",
  nom: "Semaine sans anomalie ouverte",
  pointsEquipe: 0,
  active: false,
} as const;
