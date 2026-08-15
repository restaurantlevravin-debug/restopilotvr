import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { hasPermission } from "@/constants/permissions";
import {
  obtenirCleStockageUtilisateurs,
  STOCKAGE_ENTREPRISES,
  STOCKAGE_ENTREPRISE_ACTIVE,
} from "@/constants/storage";
import type {
  Entreprise,
  ExceptionExploitation,
  JourOuverture,
  Utilisateur,
} from "@/types/entreprise";

export type {
  Entreprise,
  ExceptionExploitation,
  JourOuverture,
  ServiceOuverture,
  TypeExceptionExploitation,
} from "@/types/entreprise";


type EntrepriseContextType = {
  entreprises: Entreprise[];
  entrepriseActive?: Entreprise;
  ajouterEntreprise: (
    entreprise: Omit<
      Entreprise,
      "id" | "joursOuverture" | "exceptionsExploitation" | "animationEquipeActive"
    > & {
      joursOuverture?: JourOuverture[];
      exceptionsExploitation?: ExceptionExploitation[];
      animationEquipeActive?: boolean;
    }
  ) => Promise<void>;
  changerEntreprise: (id: string) => Promise<void>;
  modifierHorairesEntreprise: (
    joursOuverture: JourOuverture[]
  ) => Promise<boolean>;
  obtenirHorairesEntreprise: (entrepriseId?: string) => JourOuverture[];
  modifierAnimationEquipeActive: (active: boolean) => Promise<boolean>;
};


const EntrepriseContext = createContext<EntrepriseContextType | null>(null);

function copierHoraires(joursOuverture: JourOuverture[]): JourOuverture[] {
  return joursOuverture.map((jour) => ({
    ...jour,
    services: jour.services.map((service) => ({ ...service })),
  }));
}

function copierExceptions(
  exceptions: ExceptionExploitation[]
): ExceptionExploitation[] {
  return exceptions.map((exception) => ({
    ...exception,
    services: exception.services.map((service) => ({ ...service })),
  }));
}

function normaliserEntreprise(entreprise: Entreprise): Entreprise {
  return {
    ...entreprise,
    joursOuverture: copierHoraires(entreprise.joursOuverture ?? []),
    exceptionsExploitation: copierExceptions(
      entreprise.exceptionsExploitation ?? []
    ),
    animationEquipeActive: entreprise.animationEquipeActive ?? true,
  };
}


export function EntrepriseProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseActive, setEntrepriseActive] = useState<Entreprise>();


  useEffect(() => {
    charger();
  }, []);


  async function charger() {

    try {
      const [data, idActif] = await Promise.all([
        AsyncStorage.getItem(STOCKAGE_ENTREPRISES),
        AsyncStorage.getItem(STOCKAGE_ENTREPRISE_ACTIVE),
      ]);

      if (!data) {
        return;
      }

      const listeStockee = JSON.parse(data) as Entreprise[];
      const liste = listeStockee.map(normaliserEntreprise);
      const active = liste.find((entreprise) => entreprise.id === idActif)
        ?? liste[0];

      if (listeStockee.some(
        (entreprise) =>
          !entreprise.joursOuverture || !entreprise.exceptionsExploitation
          || entreprise.animationEquipeActive === undefined
      )) {
        await AsyncStorage.setItem(
          STOCKAGE_ENTREPRISES,
          JSON.stringify(liste)
        );
      }

      setEntreprises(liste);
      setEntrepriseActive(active);
    } catch (error) {
      console.error("Erreur chargement entreprises", error);
      setEntreprises([]);
      setEntrepriseActive(undefined);
    }

  }


  async function ajouterEntreprise(
    entreprise: Omit<
      Entreprise,
      "id" | "joursOuverture" | "exceptionsExploitation" | "animationEquipeActive"
    > & {
      joursOuverture?: JourOuverture[];
      exceptionsExploitation?: ExceptionExploitation[];
      animationEquipeActive?: boolean;
    }
  ) {

    const nouvelle: Entreprise = {
      ...entreprise,
      id: Date.now().toString(),
      joursOuverture: copierHoraires(entreprise.joursOuverture ?? []),
      exceptionsExploitation: copierExceptions(
        entreprise.exceptionsExploitation ?? []
      ),
      animationEquipeActive: entreprise.animationEquipeActive ?? true,
    };

    const stockage = await AsyncStorage.getItem(STOCKAGE_ENTREPRISES);
    const listeExistante = stockage
      ? (JSON.parse(stockage) as Entreprise[]).map(normaliserEntreprise)
      : entreprises;
    const liste = [...listeExistante, nouvelle];

    setEntreprises(liste);

    await AsyncStorage.setItem(
      STOCKAGE_ENTREPRISES,
      JSON.stringify(liste)
    );

    if (!entrepriseActive) {
      setEntrepriseActive(nouvelle);
      await AsyncStorage.setItem(STOCKAGE_ENTREPRISE_ACTIVE, nouvelle.id);
    }

  }


  async function changerEntreprise(id: string) {

    const entreprise = entreprises.find((e) => e.id === id);

    if (!entreprise) {
      return;
    }

    setEntrepriseActive(entreprise);
    await AsyncStorage.setItem(STOCKAGE_ENTREPRISE_ACTIVE, entreprise.id);

  }


  function obtenirHorairesEntreprise(entrepriseId?: string): JourOuverture[] {

    const id = entrepriseId ?? entrepriseActive?.id;
    const entreprise = entreprises.find((element) => element.id === id);

    return copierHoraires(entreprise?.joursOuverture ?? []);

  }


  async function modifierHorairesEntreprise(
    joursOuverture: JourOuverture[]
  ): Promise<boolean> {

    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return false;
    }

    try {
      const utilisateursStockes = await AsyncStorage.getItem(
        obtenirCleStockageUtilisateurs(entrepriseId)
      );
      const utilisateurs = utilisateursStockes
        ? JSON.parse(utilisateursStockes) as Utilisateur[]
        : [];
      const utilisateurActif = utilisateurs.find(
        (utilisateur) =>
          utilisateur.entrepriseId === entrepriseId && utilisateur.actif
      ) ?? utilisateurs.find(
        (utilisateur) => utilisateur.entrepriseId === entrepriseId
      );

      if (
        utilisateurActif?.role !== "GERANT"
        || !hasPermission(utilisateurActif, "administrationEntreprise")
      ) {
        return false;
      }

      const horaires = copierHoraires(joursOuverture);
      const liste = entreprises.map((entreprise) =>
        entreprise.id === entrepriseId
          ? { ...entreprise, joursOuverture: horaires }
          : entreprise
      );
      const active = liste.find((entreprise) => entreprise.id === entrepriseId);

      setEntreprises(liste);
      setEntrepriseActive(active);
      await AsyncStorage.setItem(STOCKAGE_ENTREPRISES, JSON.stringify(liste));

      return true;
    } catch (error) {
      console.error("Erreur modification horaires entreprise", error);
      return false;
    }

  }


  async function modifierAnimationEquipeActive(
    active: boolean
  ): Promise<boolean> {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return false;
    }

    try {
      const utilisateursStockes = await AsyncStorage.getItem(
        obtenirCleStockageUtilisateurs(entrepriseId)
      );
      const utilisateurs = utilisateursStockes
        ? JSON.parse(utilisateursStockes) as Utilisateur[]
        : [];
      const gerant = utilisateurs.find(
        (utilisateur) =>
          utilisateur.entrepriseId === entrepriseId
          && utilisateur.actif
          && utilisateur.role === "GERANT"
      );

      if (!hasPermission(gerant, "administrationEntreprise")) {
        return false;
      }

      const liste = entreprises.map((entreprise) =>
        entreprise.id === entrepriseId
          ? { ...entreprise, animationEquipeActive: active }
          : entreprise
      );

      setEntreprises(liste);
      setEntrepriseActive(
        liste.find((entreprise) => entreprise.id === entrepriseId)
      );
      await AsyncStorage.setItem(STOCKAGE_ENTREPRISES, JSON.stringify(liste));
      return true;
    } catch (error) {
      console.error("Erreur modification animation équipe", error);
      return false;
    }
  }


  return (
    <EntrepriseContext.Provider
      value={{
        entreprises,
        entrepriseActive,
        ajouterEntreprise,
        changerEntreprise,
        modifierHorairesEntreprise,
        obtenirHorairesEntreprise,
        modifierAnimationEquipeActive,
      }}
    >
      {children}
    </EntrepriseContext.Provider>
  );

}


export function useEntreprise() {

  const context = useContext(EntrepriseContext);

  if (!context) {
    throw new Error(
      "useEntreprise doit être utilisé dans EntrepriseProvider"
    );
  }

  return context;

}
