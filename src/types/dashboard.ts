import type { GradeImperial } from "@/types/reward";

export type StatutJournee = "CONFORME" | "ACTIONS_EN_ATTENTE" | "ANOMALIES_CRITIQUES";

export type AlerteDashboard = {
  id: string;
  type: "RELEVES_MANQUANTS" | "ACTIONS_NON_VALIDEES" | "ANOMALIES_OUVERTES" | "VALIDATIONS_EN_ATTENTE";
  niveau: "INFO" | "ATTENTION" | "CRITIQUE";
  message: string;
  nombre: number;
};

export type ScoreHaccpDashboard = {
  total: number;
  nombreReleves: number;
  tauxConformite: number;
  nombrePhotos: number;
  actionsCorrectivesOuvertes: number;
};

export type MembreEquipeImperiale = {
  utilisateurId: string;
  prenom: string;
  avatarId: string;
  grade: GradeImperial;
  pointsHaccp: number;
  tauxConformite: number;
  recompensesObtenues: number;
  derniereAction: string;
  dateDerniereAction?: string;
};

export type MembreClassementImperial = MembreEquipeImperiale & {
  position: number;
};

export type DashboardEntreprise = {
  entrepriseId: string;
  scoreHaccp: ScoreHaccpDashboard;
  alertes: AlerteDashboard[];
  equipe: MembreEquipeImperiale[];
  classement: MembreClassementImperial[];
  statutJournee: StatutJournee;
};
