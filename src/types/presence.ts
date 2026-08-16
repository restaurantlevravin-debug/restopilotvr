export type StatutPresence = "NON_ARRIVE" | "EN_SERVICE" | "TERMINE";

export type PresenceJournee = {
  id: string;
  entrepriseId: string;
  utilisateurId: string;
  date: string;
  horairePrevu: string;
  arrivee?: string;
  depart?: string;
  statut: StatutPresence;
  /** Positif = retard, négatif = avance. */
  ecartMinutes: number;
};
