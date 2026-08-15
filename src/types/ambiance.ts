export type TypeServiceAmbiance =
  | "ARRIVEE_MATIN"
  | "DEPART_COUPURE"
  | "REPRISE_SOIR"
  | "DEPART_FIN_JOURNEE";

export type ServiceMessage = {
  id: string;
  typeService: TypeServiceAmbiance;
  titre: string;
  message: string;
  emojis: string[];
  actif: boolean;
  entrepriseId?: string;
  equipeId?: string;
};

export type AmbiancePointage = {
  pointageId: string;
  utilisateurId: string;
  prenom: string;
  poste: string;
  heure: string;
  typeService: TypeServiceAmbiance;
  titre: string;
  message: string;
  emojis: string[];
};
