import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { hasPermission } from "@/constants/permissions";
import { obtenirCleStockageValidations } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import type { Utilisateur } from "@/types/entreprise";
import type {
  DemandeValidation,
  IdentiteValidation,
  ValidationAction,
} from "@/types/validation";

export type {
  DemandeValidation,
  IdentiteValidation,
  MethodeValidation,
  ValidationAction,
} from "@/types/validation";

type ValidationContextType = {
  validations: ValidationAction[];
  utilisateursValidateurs: Utilisateur[];
  validerAction: (
    demande: DemandeValidation
  ) => Promise<ValidationAction | null>;
  obtenirValidationsAction: (
    actionType: string,
    actionId: string
  ) => ValidationAction[];
};

const ValidationContext = createContext<ValidationContextType | null>(null);

function formaterDateLocale(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function formaterHeureLocale(date: Date): string {
  const heures = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const secondes = String(date.getSeconds()).padStart(2, "0");
  return `${heures}:${minutes}:${secondes}`;
}

export function ValidationProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurs } = useUser();
  const [validations, setValidations] = useState<ValidationAction[]>([]);

  const utilisateursValidateurs = utilisateurs.filter(
    (utilisateur) =>
      utilisateur.entrepriseId === entrepriseActive?.id
      && hasPermission(utilisateur, "validationAction")
  );

  useEffect(() => {
    void chargerValidations();
  }, [entrepriseActive?.id]);

  async function chargerValidations() {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      setValidations([]);
      return;
    }

    try {
      const stockage = await AsyncStorage.getItem(
        obtenirCleStockageValidations(entrepriseId)
      );
      const liste = stockage ? JSON.parse(stockage) as ValidationAction[] : [];
      setValidations(
        liste.filter((validation) => validation.entrepriseId === entrepriseId)
      );
    } catch (error) {
      console.error("Erreur chargement validations", error);
      setValidations([]);
    }
  }

  async function validerAction(
    demande: DemandeValidation
  ): Promise<ValidationAction | null> {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return null;
    }

    let validateur: Utilisateur | undefined;

    if (demande.methodeValidation === "CLIC") {
      validateur = utilisateursValidateurs.find(
        (utilisateur) => utilisateur.id === demande.utilisateurId
      );
    } else {
      const correspondances = utilisateursValidateurs.filter(
        (utilisateur) =>
          (utilisateur.pinValidation ?? utilisateur.pin) === demande.pin
      );

      if (correspondances.length !== 1) {
        return null;
      }

      [validateur] = correspondances;
    }

    const permissionRequise = demande.permissionRequise ?? "validationAction";

    if (
      !validateur
      || validateur.entrepriseId !== entrepriseId
      || !hasPermission(validateur, permissionRequise)
    ) {
      return null;
    }

    const maintenant = new Date();
    const validation: ValidationAction = {
      id: `${maintenant.getTime()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId,
      actionType: demande.actionType,
      actionId: demande.actionId,
      valideParUtilisateurId: validateur.id,
      valideParNom: validateur.nom,
      valideParRole: validateur.role,
      dateValidation: formaterDateLocale(maintenant),
      heureValidation: formaterHeureLocale(maintenant),
      methodeValidation: demande.methodeValidation,
    };
    const cleStockage = obtenirCleStockageValidations(entrepriseId);
    const stockage = await AsyncStorage.getItem(cleStockage);
    const listeStockee = stockage
      ? (JSON.parse(stockage) as ValidationAction[]).filter(
          (element) => element.entrepriseId === entrepriseId
        )
      : [];
    const liste = [...listeStockee, validation];

    setValidations(liste);
    await AsyncStorage.setItem(cleStockage, JSON.stringify(liste));

    return validation;
  }

  function obtenirValidationsAction(
    actionType: string,
    actionId: string
  ): ValidationAction[] {
    return validations.filter(
      (validation) =>
        validation.actionType === actionType && validation.actionId === actionId
    );
  }

  return (
    <ValidationContext.Provider
      value={{
        validations,
        utilisateursValidateurs,
        validerAction,
        obtenirValidationsAction,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);

  if (!context) {
    throw new Error(
      "useValidation doit être utilisé dans ValidationProvider"
    );
  }

  return context;
}
