import type {
  Permission,
  PermissionsUtilisateur,
  RoleUtilisateur,
  Utilisateur,
} from "@/types/entreprise";

export const PERMISSIONS_PAR_ROLE: Record<
  RoleUtilisateur,
  Readonly<PermissionsUtilisateur>
> = {
  GERANT: {
    administrationEntreprise: true,
    gestionUtilisateurs: true,
    configurationHaccp: true,
    gestionPlanning: true,
    gestionPointage: true,
    validationAction: true,
    validationJournee: true,
  },
  CHEF_CUISINE: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: true,
    gestionPlanning: false,
    gestionPointage: false,
    validationAction: true,
    validationJournee: false,
  },
  MAITRE_HOTEL: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: false,
    gestionPlanning: false,
    gestionPointage: false,
    validationAction: true,
    validationJournee: false,
  },
  SALARIE: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: false,
    gestionPlanning: false,
    gestionPointage: false,
    validationAction: false,
    validationJournee: false,
  },
};

export const AUCUNE_PERMISSION: Readonly<PermissionsUtilisateur> = {
  administrationEntreprise: false,
  gestionUtilisateurs: false,
  configurationHaccp: false,
  gestionPlanning: false,
  gestionPointage: false,
  validationAction: false,
  validationJournee: false,
};

export function hasPermission(
  utilisateur: Utilisateur | null | undefined,
  permission: Permission
): boolean {
  return utilisateur
    ? PERMISSIONS_PAR_ROLE[utilisateur.role][permission]
    : false;
}
