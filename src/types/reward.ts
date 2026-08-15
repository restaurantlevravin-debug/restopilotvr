export type GradeImperial =
  | "PADAWAN HACCP"
  | "MONSTRE HACCP"
  | "EMPEREUR IMPÉRIAL"
  | "BOULANGER IMPÉRIAL"
  | "PÂTISSIER IMPÉRIAL"
  | "SAUCIER IMPÉRIAL"
  | "POISSONNIER IMPÉRIAL"
  | "BARMAN IMPÉRIAL"
  | "BOUCHER IMPÉRIAL"
  | "SOMMELIER IMPÉRIAL"
  | "COMMIS IMPÉRIAL";

export type TypeActionProgression =
  | "RELEVE_TEMPERATURE"
  | "CONTROLE_HACCP"
  | "PREUVE_PHOTO"
  | "ANOMALIE_TRAITEE"
  | "ACTION_CORRECTIVE_VALIDEE"
  | "VALIDATION_RESPONSABLE"
  | "RELEVE_CONFORME_VALIDE"
  | "JOURNEE_COMPLETE_HACCP"
  | "SEMAINE_PARFAITE"
  | "OUBLI_CRITIQUE"
  | "NON_VALIDATION_OBLIGATOIRE";

export type ParametresAttributionPoints = {
  utilisateurId: string;
  entrepriseId: string;
  typeAction: string;
  conformite: boolean;
  validation: boolean;
};

export type ActionProgression = {
  id: string;
  type: string;
  points: number;
  description: string;
  date: string;
  utilisateurId: string;
  entrepriseId: string;
};

export type RecompenseHistorique = {
  id: string;
  recompenseId: string;
  dateDeblocage: string;
};

export type ProfilImperialUtilisateur = {
  utilisateurId: string;
  entrepriseId: string;
  avatarActuel: string;
  niveau: number;
  pointsHaccp: number;
  grade: GradeImperial;
  recompensesDebloquees: string[];
  historiqueRecompenses: RecompenseHistorique[];
  historiqueProgression: ActionProgression[];
  nombreActionsEvaluees: number;
  nombreActionsConformes: number;
  oublisCritiques: number;
};
