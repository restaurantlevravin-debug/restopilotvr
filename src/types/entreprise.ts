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
  | "validationJournee";

export type PermissionsUtilisateur = Record<Permission, boolean>;

export type Entreprise = {
  id: string;
  nom: string;
  adresse?: string;
  actif: boolean;
};

export type Utilisateur = {
  id: string;
  entrepriseId: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  actif: boolean;
  pin?: string;
};
