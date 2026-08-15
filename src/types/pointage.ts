import type { MethodeValidation } from "@/types/validation";

export type TypePointage =
  | "ARRIVEE"
  | "DEPART_PAUSE"
  | "REPRISE_PAUSE"
  | "DEPART_SERVICE";

export type Pointage = {
  id: string;
  entrepriseId: string;
  utilisateurId: string;
  date: string;
  heure: string;
  type: TypePointage;
  methode: MethodeValidation;
  commentaire?: string;
  planningId?: string;
  correction?: CorrectionPointage;
};

export type CorrectionPointage = {
  corrigeParUtilisateurId: string;
  dateCorrection: string;
  heureCorrection: string;
  ancienneDate: string;
  ancienneHeure: string;
  ancienType: TypePointage;
  motif: string;
};

export type IdentificationPointage =
  | {
      methode: "CLIC";
      utilisateurId: string;
    }
  | {
      methode: "PIN";
      utilisateurId: string;
      pin: string;
    };

export type DemandePointage = IdentificationPointage & {
  type: TypePointage;
  planningId?: string;
  commentaire?: string;
};

export type ModificationPointage = Partial<
  Pick<Pointage, "date" | "heure" | "type" | "planningId">
> & {
  motif: string;
};
