import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { obtenirCleValidationsHeures } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { usePointagePad } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";
import { construireComparaisonTemps } from "@/services/calculTempsService";
import type { LigneSyntheseHeures, SyntheseHeuresMois, ValidationHeuresMensuelle } from "@/types/validationHeures";

type ValidationHeuresContextType = {
  validations: ValidationHeuresMensuelle[];
  creerValidationMensuelle: (mois: number, annee: number) => Promise<ValidationHeuresMensuelle | null>;
  obtenirValidationMensuelle: (mois: number, annee: number) => ValidationHeuresMensuelle | undefined;
  obtenirSyntheseMois: (mois: number, annee: number) => SyntheseHeuresMois | null;
  ajouterRemarque: (mois: number, annee: number, utilisateurId: string, remarque: string) => Promise<boolean>;
  validerHeuresMois: (mois: number, annee: number) => Promise<boolean>;
};

const ValidationHeuresContext = createContext<ValidationHeuresContextType | null>(null);

export function ValidationHeuresProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif } = useUser();
  const { obtenirPlanningEntreprise } = usePlanning();
  const { obtenirPointagesGerant } = usePointagePad();
  const [validations, setValidations] = useState<ValidationHeuresMensuelle[]>([]);

  useEffect(() => { void charger(); }, [entrepriseActive?.id]);

  async function charger() {
    if (!entrepriseActive) { setValidations([]); return; }
    const stockage = await AsyncStorage.getItem(obtenirCleValidationsHeures(entrepriseActive.id));
    const liste = stockage ? JSON.parse(stockage) as ValidationHeuresMensuelle[] : [];
    setValidations(liste.filter((validation) => validation.entrepriseId === entrepriseActive.id).map((validation) => ({ ...validation, remarques: validation.remarques ?? {} })));
  }

  async function sauvegarder(liste: ValidationHeuresMensuelle[]) {
    if (!entrepriseActive) return;
    const entreprise = liste.filter((validation) => validation.entrepriseId === entrepriseActive.id);
    setValidations(entreprise);
    await AsyncStorage.setItem(obtenirCleValidationsHeures(entrepriseActive.id), JSON.stringify(entreprise));
  }

  function obtenirValidationMensuelle(mois: number, annee: number) {
    return validations.find((validation) => validation.mois === String(mois).padStart(2, "0") && validation.annee === annee);
  }

  async function creerValidationMensuelle(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive || mois < 1 || mois > 12) return null;
    const existante = obtenirValidationMensuelle(mois, annee);
    if (existante) return existante;
    const nouvelle: ValidationHeuresMensuelle = { id: `${entrepriseActive.id}-${annee}-${String(mois).padStart(2, "0")}`, entrepriseId: entrepriseActive.id, mois: String(mois).padStart(2, "0"), annee, statut: obtenirPlanningEntreprise(mois, annee) ? "A_VALIDER" : "EN_COURS", remarques: {} };
    await sauvegarder([...validations, nouvelle]);
    return nouvelle;
  }

  function obtenirSyntheseMois(mois: number, annee: number): SyntheseHeuresMois | null {
    if (!entrepriseActive || utilisateurActif?.role !== "GERANT") return null;
    const entrepriseId = entrepriseActive.id;
    const planning = obtenirPlanningEntreprise(mois, annee);
    if (!planning) return null;
    const validation = obtenirValidationMensuelle(mois, annee);
    const pointages = obtenirPointagesGerant();
    const lignes: LigneSyntheseHeures[] = planning.lignes.map((ligne) => {
      let prevu = 0; let realise = 0;
      ligne.jours.forEach((jour) => {
        const pointagesJour = pointages.filter((pointage) => pointage.date === jour.date && pointage.utilisateurId === ligne.utilisateurId);
        const comparaison = construireComparaisonTemps({ entrepriseId, utilisateurId: ligne.utilisateurId, date: jour.date, jour, pointages: pointagesJour });
        prevu += comparaison.tempsPrevu;
        realise += comparaison.pointageReel.departService ? comparaison.tempsReel : 0;
      });
      const ecart = realise - prevu;
      return { utilisateurId: ligne.utilisateurId, nom: ligne.nom, poste: ligne.poste, contratHebdomadaire: ligne.heuresContratHebdomadaires, heuresPrevuesMinutes: prevu, heuresRealiseesMinutes: realise, ecartMinutes: ecart, heuresSupplementairesMinutes: Math.max(0, ecart), remarque: validation?.remarques[ligne.utilisateurId] };
    });
    const somme = (selection: (ligne: LigneSyntheseHeures) => number) => lignes.reduce((total, ligne) => total + selection(ligne), 0);
    return { entrepriseId, mois, annee, lignes, totalPrevuMinutes: somme((ligne) => ligne.heuresPrevuesMinutes), totalRealiseMinutes: somme((ligne) => ligne.heuresRealiseesMinutes), totalEcartMinutes: somme((ligne) => ligne.ecartMinutes), totalHeuresSupplementairesMinutes: somme((ligne) => ligne.heuresSupplementairesMinutes) };
  }

  async function ajouterRemarque(mois: number, annee: number, utilisateurId: string, remarque: string) {
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE") return false;
    await sauvegarder(validations.map((element) => element.id === validation.id ? { ...element, remarques: { ...element.remarques, [utilisateurId]: remarque.trim() } } : element));
    return true;
  }

  async function validerHeuresMois(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE" || !obtenirSyntheseMois(mois, annee)) return false;
    await sauvegarder(validations.map((element) => element.id === validation.id ? { ...element, statut: "VALIDEE", validePar: utilisateurActif.id, dateValidation: new Date().toISOString() } : element));
    return true;
  }

  return <ValidationHeuresContext.Provider value={{ validations, creerValidationMensuelle, obtenirValidationMensuelle, obtenirSyntheseMois, ajouterRemarque, validerHeuresMois }}>{children}</ValidationHeuresContext.Provider>;
}

export function useValidationHeures() {
  const contexte = useContext(ValidationHeuresContext);
  if (!contexte) throw new Error("useValidationHeures doit être utilisé dans ValidationHeuresProvider");
  return contexte;
}
