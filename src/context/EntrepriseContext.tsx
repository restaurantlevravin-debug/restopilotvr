import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Entreprise } from "@/types/entreprise";

export type { Entreprise } from "@/types/entreprise";


type EntrepriseContextType = {
  entreprises: Entreprise[];
  entrepriseActive?: Entreprise;
  ajouterEntreprise: (entreprise: Omit<Entreprise, "id">) => Promise<void>;
  changerEntreprise: (id: string) => Promise<void>;
};


const STOCKAGE_ENTREPRISES = "RESTOPILOT_ENTREPRISES";
const STOCKAGE_ENTREPRISE_ACTIVE = "RESTOPILOT_ENTREPRISE_ACTIVE";


const EntrepriseContext = createContext<EntrepriseContextType | null>(null);


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

      const liste = JSON.parse(data) as Entreprise[];
      const active = liste.find((entreprise) => entreprise.id === idActif)
        ?? liste[0];

      setEntreprises(liste);
      setEntrepriseActive(active);
    } catch (error) {
      console.error("Erreur chargement entreprises", error);
      setEntreprises([]);
      setEntrepriseActive(undefined);
    }

  }


  async function ajouterEntreprise(
    entreprise: Omit<Entreprise, "id">
  ) {

    const nouvelle: Entreprise = {
      id: Date.now().toString(),
      ...entreprise,
    };

    const stockage = await AsyncStorage.getItem(STOCKAGE_ENTREPRISES);
    const listeExistante = stockage
      ? JSON.parse(stockage) as Entreprise[]
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


  return (
    <EntrepriseContext.Provider
      value={{
        entreprises,
        entrepriseActive,
        ajouterEntreprise,
        changerEntreprise,
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
