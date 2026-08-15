import type { ValidationAction } from "@/types/validation";

export type TypeControleHaccp =
  | "TEMPERATURE"
  | "RECEPTION"
  | "NETTOYAGE"
  | "AUTRE";

export type FrequenceControleHaccp =
  | "QUOTIDIEN"
  | "HEBDOMADAIRE"
  | "AUTRE";

export type PointControleHaccp = {
  id: string;
  entrepriseId: string;
  nom: string;
  description?: string;
  zone: string;
  typeControle: TypeControleHaccp;
  frequence: FrequenceControleHaccp;
  obligatoire: boolean;
  actif: boolean;
  creePar: string;
  dateCreation: string;
  utilisateursAutorises: string[];
  temperatureMin?: number;
  temperatureMax?: number;
};

export type ControleRealise = {
  id: string;
  pointControleId: string;
  utilisateurId: string;
  entrepriseId: string;
  date: string;
  heure: string;
  valeur?: string;
  conforme: boolean;
  photo?: string;
  commentaire?: string;
  actionCorrective?: string;
  statutValidation: "EN_ATTENTE" | "VALIDE" | "CLOS";
  validation?: ValidationAction;
};
