import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { hasPermission } from "@/constants/permissions";
import { obtenirCleStockagePointages } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import { creerAmbiancePointage } from "@/services/serviceMessages";
import type { AmbiancePointage } from "@/types/ambiance";
import type {
  DemandePointage,
  ModificationPointage,
  Pointage,
} from "@/types/pointage";
import type { IdentiteValidation, ValidationAction } from "@/types/validation";

export type {
  CorrectionPointage,
  DemandePointage,
  IdentificationPointage,
  ModificationPointage,
  Pointage,
  TypePointage,
} from "@/types/pointage";

export type ModePointage = "PAD_CENTRAL" | "GESTION_GERANT";

type PointagePadContextType = {
  mode: ModePointage;
  ambiancePointage: AmbiancePointage | null;
  fermerAmbiancePointage: () => void;
  enregistrerPointage: (demande: DemandePointage) => Promise<Pointage | null>;
  obtenirHistoriqueUtilisateur: (utilisateurId: string) => Pointage[];
  obtenirPointagesGerant: (date?: string) => Pointage[];
  corrigerPointage: (
    pointageId: string,
    modification: ModificationPointage
  ) => Promise<boolean>;
  validerJourneePointage: (
    date: string,
    identite: IdentiteValidation
  ) => Promise<ValidationAction | null>;
};

const PointagePadContext = createContext<PointagePadContextType | null>(null);

function formaterDateLocale(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function formaterHeureLocale(date: Date): string {
  return [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((valeur) => String(valeur).padStart(2, "0"))
    .join(":");
}

export function PointagePadProvider({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: ModePointage;
}) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurs, utilisateurActif } = useUser();
  const { validerAction } = useValidation();
  const [pointages, setPointages] = useState<Pointage[]>([]);
  const [ambiancePointage, setAmbiancePointage] =
    useState<AmbiancePointage | null>(null);

  useEffect(() => {
    void chargerPointages();
  }, [entrepriseActive?.id]);

  async function chargerPointages() {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      setPointages([]);
      return;
    }

    try {
      const stockage = await AsyncStorage.getItem(
        obtenirCleStockagePointages(entrepriseId)
      );
      const liste = stockage ? JSON.parse(stockage) as Pointage[] : [];
      setPointages(
        liste.filter((pointage) => pointage.entrepriseId === entrepriseId)
      );
    } catch (error) {
      console.error("Erreur chargement pointages", error);
      setPointages([]);
    }
  }

  async function sauvegarder(liste: Pointage[]) {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return;
    }

    const listeEntreprise = liste.filter(
      (pointage) => pointage.entrepriseId === entrepriseId
    );
    setPointages(listeEntreprise);
    await AsyncStorage.setItem(
      obtenirCleStockagePointages(entrepriseId),
      JSON.stringify(listeEntreprise)
    );
  }

  async function enregistrerPointage(
    demande: DemandePointage
  ): Promise<Pointage | null> {
    const entrepriseId = entrepriseActive?.id;

    if (mode !== "PAD_CENTRAL" || !entrepriseId) {
      return null;
    }

    const utilisateursEntreprise = utilisateurs.filter(
      (utilisateur) => utilisateur.entrepriseId === entrepriseId
    );
    const correspondances = demande.methode === "CLIC"
      ? utilisateursEntreprise.filter(
          (utilisateur) => utilisateur.id === demande.utilisateurId
        )
      : utilisateursEntreprise.filter(
          (utilisateur) =>
            (utilisateur.pinValidation ?? utilisateur.pin) === demande.pin
        );

    if (correspondances.length !== 1) {
      return null;
    }

    const maintenant = new Date();
    const pointage: Pointage = {
      id: `${maintenant.getTime()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId,
      utilisateurId: correspondances[0].id,
      date: formaterDateLocale(maintenant),
      heure: formaterHeureLocale(maintenant),
      type: demande.type,
      methode: demande.methode,
      planningId: demande.planningId,
    };

    await sauvegarder([...pointages, pointage]);

    if (entrepriseActive.animationEquipeActive) {
      try {
        setAmbiancePointage(
          creerAmbiancePointage({
            pointage,
            utilisateur: correspondances[0],
            historique: pointages,
          })
        );
      } catch (error) {
        console.error("Erreur création ambiance pointage", error);
        setAmbiancePointage(null);
      }
    } else {
      setAmbiancePointage(null);
    }

    return pointage;
  }

  function fermerAmbiancePointage() {
    setAmbiancePointage(null);
  }

  function obtenirHistoriqueUtilisateur(utilisateurId: string): Pointage[] {
    return pointages.filter(
      (pointage) => pointage.utilisateurId === utilisateurId
    );
  }

  function obtenirPointagesGerant(date?: string): Pointage[] {
    if (!hasPermission(utilisateurActif, "gestionPointage")) {
      return [];
    }

    return date
      ? pointages.filter((pointage) => pointage.date === date)
      : [...pointages];
  }

  async function corrigerPointage(
    pointageId: string,
    modification: ModificationPointage
  ): Promise<boolean> {
    if (
      mode !== "GESTION_GERANT"
      || !utilisateurActif
      || utilisateurActif.role !== "GERANT"
      || !hasPermission(utilisateurActif, "gestionPointage")
      || !modification.motif.trim()
    ) {
      return false;
    }

    const existant = pointages.find((pointage) => pointage.id === pointageId);

    if (!existant || existant.entrepriseId !== entrepriseActive?.id) {
      return false;
    }

    const maintenant = new Date();
    const liste = pointages.map((pointage) =>
      pointage.id === pointageId
        ? {
            ...pointage,
            ...modification,
            correction: {
              corrigeParUtilisateurId: utilisateurActif.id,
              dateCorrection: formaterDateLocale(maintenant),
              heureCorrection: formaterHeureLocale(maintenant),
              ancienneDate: pointage.date,
              ancienneHeure: pointage.heure,
              ancienType: pointage.type,
              motif: modification.motif.trim(),
            },
          }
        : pointage
    );

    await sauvegarder(liste);
    return true;
  }

  async function validerJourneePointage(
    date: string,
    identite: IdentiteValidation
  ): Promise<ValidationAction | null> {
    if (mode !== "GESTION_GERANT") {
      return null;
    }

    return validerAction({
      actionType: "POINTAGE_JOURNEE",
      actionId: date,
      permissionRequise: "validationJournee",
      ...identite,
    });
  }

  return (
    <PointagePadContext.Provider
      value={{
        mode,
        ambiancePointage,
        fermerAmbiancePointage,
        enregistrerPointage,
        obtenirHistoriqueUtilisateur,
        obtenirPointagesGerant,
        corrigerPointage,
        validerJourneePointage,
      }}
    >
      {children}
    </PointagePadContext.Provider>
  );
}

export function usePointagePad() {
  const context = useContext(PointagePadContext);

  if (!context) {
    throw new Error(
      "usePointagePad est réservé à un PointagePadProvider central ou gérant"
    );
  }

  return context;
}
