export const STOCKAGE_ENTREPRISES = "RESTOPILOT_ENTREPRISES";
export const STOCKAGE_ENTREPRISE_ACTIVE = "RESTOPILOT_ENTREPRISE_ACTIVE";
export const STOCKAGE_USERS_PREFIX = "RESTOPILOT_USERS_";
export const STOCKAGE_VALIDATIONS_PREFIX = "RESTOPILOT_VALIDATIONS_";
export const STOCKAGE_POINTAGES_PREFIX = "RESTOPILOT_POINTAGES_";
export const STOCKAGE_PROFILS_IMPERIAUX_PREFIX = "RESTOPILOT_PROFILS_IMPERIAUX_";
export const STOCKAGE_CLASSEMENT_IMPERIAL_PREFIX = "RESTOPILOT_CLASSEMENT_IMPERIAL_";
export const STOCKAGE_CLOTURES_JOURNEE_PREFIX = "RESTOPILOT_CLOTURES_JOURNEE_";
export const STOCKAGE_ANOMALIES_HACCP_PREFIX = "RESTOPILOT_ANOMALIES_HACCP_";

export function obtenirCleStockageUtilisateurs(entrepriseId: string): string {
  return `${STOCKAGE_USERS_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageValidations(entrepriseId: string): string {
  return `${STOCKAGE_VALIDATIONS_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockagePointages(entrepriseId: string): string {
  return `${STOCKAGE_POINTAGES_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageProfilsImperiaux(
  entrepriseId: string
): string {
  return `${STOCKAGE_PROFILS_IMPERIAUX_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageClassementImperial(
  entrepriseId: string
): string {
  return `${STOCKAGE_CLASSEMENT_IMPERIAL_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageCloturesJournee(
  entrepriseId: string
): string {
  return `${STOCKAGE_CLOTURES_JOURNEE_PREFIX}${entrepriseId}`;
}

export function obtenirCleStockageAnomaliesHaccp(entrepriseId: string): string {
  return `${STOCKAGE_ANOMALIES_HACCP_PREFIX}${entrepriseId}`;
}
