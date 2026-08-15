export type TempsTravail = {
  id: string;
  entrepriseId: string;
  utilisateurId: string;
  date: string;
  planningPrevu: {
    debut: string;
    fin: string;
  };
  pointageReel: {
    arrivee?: string;
    departPause?: string;
    reprisePause?: string;
    departService?: string;
  };
  /** Durées et écart exprimés en minutes. */
  tempsPrevu: number;
  tempsReel: number;
  ecart: number;
};
