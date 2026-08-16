export type RoleUtilisateur =
  | "GERANT"
  | "CHEF_CUISINE"
  | "MAITRE_HOTEL"
  | "SALARIE";

export type Permission =
  | "administrationEntreprise"
  | "gestionUtilisateurs"
  | "configurationHaccp"
  | "gestionPlanning"
  | "gestionPointage"
  | "consultationValidationsHeures"
  | "validationAction"
  | "validationJournee";

export type PermissionsUtilisateur = Record<Permission, boolean>;

export type ServiceOuverture = {
  heureDebut: string;
  heureFin: string;
};

export type JourOuverture = {
  jour: string;
  ouvert: boolean;
  services: ServiceOuverture[];
};

export type TypeExceptionExploitation =
  | "HORAIRES_EXCEPTIONNELS"
  | "FERMETURE_EXCEPTIONNELLE"
  | "JOUR_FERIE";

export type ExceptionExploitation = {
  date: string;
  type: TypeExceptionExploitation;
  ouvert: boolean;
  services: ServiceOuverture[];
  motif?: string;
};

export type Entreprise = {
  id: string;
  nom: string;
  logo?: string;
  adresse?: string;
  actif: boolean;
  joursOuverture: JourOuverture[];
  exceptionsExploitation: ExceptionExploitation[];
  animationEquipeActive: boolean;
};

export type Utilisateur = {
  id: string;
  entrepriseId: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  poste?: string;
  contrat?: string;
  heuresContractuelles?: number;
  consultationDocumentsAutorisee?: boolean;
  actif: boolean;
  pinValidation?: string;
  /** @deprecated Utiliser pinValidation pour les nouvelles validations. */
  pin?: string;
};
