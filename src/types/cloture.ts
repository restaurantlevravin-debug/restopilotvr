export type StatutClotureJournee =
  | "OUVERTE"
  | "EN_ATTENTE_VALIDATION"
  | "VALIDEE"
  | "ROUVERTE_EXCEPTIONNELLEMENT";

export type ServiceCloture = {
  nom: string;
  heureDebut: string;
  heureFin: string;
  controle: boolean;
};

export type ControlesCloture = {
  haccp: boolean;
  planning: boolean;
  pointage: boolean;
  anomalies: boolean;
  actionsObligatoiresControlees: boolean;
};

export type ClotureJournee = {
  id: string;
  entrepriseId: string;
  dateDebutExploitation: string;
  dateFinExploitation?: string;
  heureFinReelle?: string;
  valideeLe?: string;
  statut: StatutClotureJournee;
  services: ServiceCloture[];
  controles: ControlesCloture;
  valideeParUtilisateurId?: string;
  validationId?: string;
  notification22hId?: string;
};

export type ResumeClotureJournee = {
  services: ServiceCloture[];
  controles: ControlesCloture;
};
