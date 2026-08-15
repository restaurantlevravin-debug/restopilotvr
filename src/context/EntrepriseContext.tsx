import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";


export type Entreprise = {
  id: string;
  nom: string;
  adresse?: string;
  actif: boolean;
};


type EntrepriseContextType = {
  entreprises: Entreprise[];
  entrepriseActive?: Entreprise;
  ajouterEntreprise: (entreprise: Omit<Entreprise, "id">) => Promise<void>;
  changerEntreprise: (id: string) => Promise<void>;
};


const STOCKAGE_ENTREPRISES = "RESTOPILOT_ENTREPRISES";


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

    const data = await AsyncStorage.getItem(STOCKAGE_ENTREPRISES);

    if (data) {
      const liste = JSON.parse(data);
      setEntreprises(liste);

      if (liste.length > 0) {
        setEntrepriseActive(liste[0]);
      }
    }

  }


  async function ajouterEntreprise(
    entreprise: Omit<Entreprise, "id">
  ) {

    const nouvelle = {
      id: Date.now().toString(),
      ...entreprise,
    };

    const liste = [...entreprises, nouvelle];

    setEntreprises(liste);

    await AsyncStorage.setItem(
      STOCKAGE_ENTREPRISES,
      JSON.stringify(liste)
    );

  }


  async function changerEntreprise(id: string) {

    const entreprise = entreprises.find((e) => e.id === id);
    setEntrepriseActive(entreprise);

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