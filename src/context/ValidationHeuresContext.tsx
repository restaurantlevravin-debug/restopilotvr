import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import { hasPermission } from "@/constants/permissions";
import { obtenirCleValidationsHeures } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { usePointagePad } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";
import { calculerSyntheseSalarie } from "@/services/heuresService";
import type { LigneSyntheseHeures, SyntheseHeuresMois, ValidationHeuresMensuelle } from "@/types/validationHeures";

type ValidationHeuresContextType = {
  validations: ValidationHeuresMensuelle[];
  creerValidationMois: (mois: number, annee: number) => Promise<ValidationHeuresMensuelle | null>;
  obtenirSyntheseHeures: (mois: number, annee: number) => SyntheseHeuresMois | null;
  ajouterCommentaire: (mois: number, annee: number, commentaire: string, utilisateurId?: string) => Promise<boolean>;
  validerMois: (mois: number, annee: number, commentaire?: string) => Promise<boolean>;
  /** Alias conservés pour compatibilité avec les écrans existants. */
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
  const validationsRef = useRef<ValidationHeuresMensuelle[]>([]);

  useEffect(() => { void charger(); }, [entrepriseActive?.id]);

  async function charger() {
    if (!entrepriseActive) { validationsRef.current = []; setValidations([]); return; }
    const stockage = await AsyncStorage.getItem(obtenirCleValidationsHeures(entrepriseActive.id));
    const liste = stockage ? JSON.parse(stockage) as ValidationHeuresMensuelle[] : [];
    const normalisees = liste
      .filter((validation) => validation.entrepriseId === entrepriseActive.id)
      .map((validation) => ({
        ...validation,
        mois: Number(validation.mois),
        remarques: validation.remarques ?? {},
      }));
    validationsRef.current = normalisees;
    setValidations(normalisees);
    if (liste.some((validation) => typeof validation.mois === "string")) {
      await AsyncStorage.setItem(
        obtenirCleValidationsHeures(entrepriseActive.id),
        JSON.stringify(normalisees)
      );
    }
  }

  async function sauvegarder(liste: ValidationHeuresMensuelle[]) {
    if (!entrepriseActive) return;
    const entreprise = liste.filter((validation) => validation.entrepriseId === entrepriseActive.id);
    validationsRef.current = entreprise;
    setValidations(entreprise);
    await AsyncStorage.setItem(obtenirCleValidationsHeures(entrepriseActive.id), JSON.stringify(entreprise));
  }

  function obtenirValidationMensuelle(mois: number, annee: number) {
    return validationsRef.current.find((validation) => validation.mois === mois && validation.annee === annee);
  }

  async function creerValidationMensuelle(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive || mois < 1 || mois > 12) return null;
    const existante = obtenirValidationMensuelle(mois, annee);
    if (existante) return existante;
    const nouvelle: ValidationHeuresMensuelle = { id: `${entrepriseActive.id}-${annee}-${String(mois).padStart(2, "0")}`, entrepriseId: entrepriseActive.id, mois, annee, statut: obtenirPlanningEntreprise(mois, annee) ? "A_VALIDER" : "EN_COURS", remarques: {} };
    await sauvegarder([...validationsRef.current, nouvelle]);
    return nouvelle;
  }

  function obtenirSyntheseMois(mois: number, annee: number): SyntheseHeuresMois | null {
    if (!entrepriseActive || !hasPermission(utilisateurActif, "consultationValidationsHeures")) return null;
    const entrepriseId = entrepriseActive.id;
    const planning = obtenirPlanningEntreprise(mois, annee);
    if (!planning) return null;
    const validation = obtenirValidationMensuelle(mois, annee);
    const pointages = obtenirPointagesGerant();
    const lignes: LigneSyntheseHeures[] = planning.lignes.map((ligne) =>
      calculerSyntheseSalarie({
        entrepriseId,
        ligne,
        pointages,
        remarque: validation?.remarques[ligne.utilisateurId],
      })
    );
    const somme = (selection: (ligne: LigneSyntheseHeures) => number) => lignes.reduce((total, ligne) => total + selection(ligne), 0);
    return { entrepriseId, mois, annee, lignes, totalPrevuMinutes: somme((ligne) => ligne.heuresPrevuesMinutes), totalRealiseMinutes: somme((ligne) => ligne.heuresRealiseesMinutes), totalEcartMinutes: somme((ligne) => ligne.ecartMinutes), totalHeuresSupplementairesMinutes: somme((ligne) => ligne.heuresSupplementairesMinutes) };
  }

  async function ajouterRemarque(mois: number, annee: number, utilisateurId: string, remarque: string) {
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE") return false;
    await sauvegarder(validationsRef.current.map((element) => element.id === validation.id ? { ...element, remarques: { ...element.remarques, [utilisateurId]: remarque.trim() } } : element));
    return true;
  }

  async function ajouterCommentaire(mois: number, annee: number, commentaire: string, utilisateurId?: string) {
    if (utilisateurId) return ajouterRemarque(mois, annee, utilisateurId, commentaire);
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE") return false;
    await sauvegarder(validationsRef.current.map((element) =>
      element.id === validation.id
        ? { ...element, commentaire: commentaire.trim() || undefined }
        : element
    ));
    return true;
  }

  async function validerHeuresMois(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE" || !obtenirSyntheseMois(mois, annee)) return false;
    await sauvegarder(validationsRef.current.map((element) => element.id === validation.id ? { ...element, statut: "VALIDEE", validePar: utilisateurActif.id, dateValidation: new Date().toISOString() } : element));
    return true;
  }


  async function validerMois(mois: number, annee: number, commentaire?: string) {
    if (utilisateurActif?.role !== "GERANT") return false;
    const validation = obtenirValidationMensuelle(mois, annee);
    if (!validation || validation.statut === "VALIDEE" || !obtenirSyntheseMois(mois, annee)) return false;
    await sauvegarder(validationsRef.current.map((element) => element.id === validation.id ? {
      ...element,
      statut: "VALIDEE",
      validePar: utilisateurActif.id,
      dateValidation: new Date().toISOString(),
      commentaire: commentaire?.trim() || element.commentaire,
    } : element));
    return true;
  }

  return <ValidationHeuresContext.Provider value={{ validations, creerValidationMois: creerValidationMensuelle, obtenirSyntheseHeures: obtenirSyntheseMois, ajouterCommentaire, validerMois, creerValidationMensuelle, obtenirValidationMensuelle, obtenirSyntheseMois, ajouterRemarque, validerHeuresMois }}>{children}</ValidationHeuresContext.Provider>;
}

export function useValidationHeures() {
  const contexte = useContext(ValidationHeuresContext);
  if (!contexte) throw new Error("useValidationHeures doit être utilisé dans ValidationHeuresProvider");
  return contexte;
}
