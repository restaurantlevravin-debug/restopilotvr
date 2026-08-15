export const STOCKAGE_ENTREPRISES = "RESTOPILOT_ENTREPRISES";
export const STOCKAGE_ENTREPRISE_ACTIVE = "RESTOPILOT_ENTREPRISE_ACTIVE";
export const STOCKAGE_USERS_PREFIX = "RESTOPILOT_USERS_";
export const STOCKAGE_VALIDATIONS_PREFIX = "RESTOPILOT_VALIDATIONS_";
export const STOCKAGE_POINTAGES_PREFIX = "RESTOPILOT_POINTAGES_";

export function obtenirCleStockageUtilisateurs(entrepriseId: string): string {
  return `${STOCKAGE_USERS_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageValidations(entrepriseId: string): string {
  return `${STOCKAGE_VALIDATIONS_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockagePointages(entrepriseId: string): string {
  return `${STOCKAGE_POINTAGES_PREFIX}${entrepriseId}`;
}
