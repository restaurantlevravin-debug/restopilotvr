import type { Permission, RoleUtilisateur } from "@/types/entreprise";

export type MethodeValidation = "PIN" | "CLIC";

export type ValidationAction = {
  id: string;
  entrepriseId: string;
  actionType: string;
  actionId: string;
  valideParUtilisateurId: string;
  valideParNom: string;
  valideParRole: RoleUtilisateur;
  dateValidation: string;
  heureValidation: string;
  methodeValidation: MethodeValidation;
};

type ActionAValider = {
  actionType: string;
  actionId: string;
  permissionRequise?: Permission;
};

export type IdentiteValidation =
  | {
      methodeValidation: "CLIC";
      utilisateurId: string;
    }
  | {
      methodeValidation: "PIN";
      pin: string;
    };

export type DemandeValidation = ActionAValider & IdentiteValidation;
