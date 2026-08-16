import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { hasPermission } from "@/constants/permissions";
import { obtenirCleStockagePlannings, obtenirCleStockagePlanningsRecurrents } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { construireComparaisonTemps } from "@/services/calculTempsService";
import type { CalculHeuresPlanning, JourPlanning, LignePlanningMensuel, PeriodeTravail, PlanningMensuel } from "@/types/planning";
import type { Pointage } from "@/types/pointage";
import { JOURS_SEMAINE_PLANNING, type PlanningRecurrence } from "@/types/planningRecurrence";
import type { TempsTravail } from "@/types/tempsTravail";

type PlanningContextType = {
  creerPlanning: (mois: number, annee: number) => Promise<PlanningMensuel | null>;
  modifierPlanning: (id: string, modifications: Partial<Pick<PlanningMensuel, "lignes">>) => Promise<boolean>;
  validerPlanning: (id: string) => Promise<boolean>;
  obtenirPlanningEntreprise: (mois: number, annee: number) => PlanningMensuel | undefined;
  obtenirPlanningUtilisateur: (utilisateurId?: string, mois?: number, annee?: number) => { planning: PlanningMensuel; ligne: LignePlanningMensuel } | undefined;
  calculerHeures: (ligne: LignePlanningMensuel, baseContrat?: "MENSUELLE" | "HEBDOMADAIRE") => CalculHeuresPlanning;
  creerModelePlanning: (modele: Omit<PlanningRecurrence, "id" | "entrepriseId">) => Promise<PlanningRecurrence | null>;
  modifierModelePlanning: (id: string, modifications: Partial<Omit<PlanningRecurrence, "id" | "entrepriseId" | "utilisateurId">>) => Promise<boolean>;
  genererPlanningMois: (mois: number, annee: number) => Promise<PlanningMensuel | null>;
  obtenirModeleEntreprise: () => PlanningRecurrence[];
  obtenirComparaisonPlanningPointage: (date: string, pointages: Pointage[]) => TempsTravail[];
};

const PlanningContext = createContext<PlanningContextType | null>(null);

function minutes(heure: string): number | null {
  const correspondance = /^(\d{1,2}):(\d{2})$/.exec(heure.trim());
  if (!correspondance) return null;
  const h = Number(correspondance[1]);
  const m = Number(correspondance[2]);
  return h <= 23 && m <= 59 ? h * 60 + m : null;
}

function dureePeriode(periode: PeriodeTravail, avecPause: boolean) {
  const debut = minutes(periode.heureDebut);
  const finInitiale = minutes(periode.heureFin);
  if (debut === null || finInitiale === null || debut === finInitiale) return 0;
  const fin = finInitiale < debut ? finInitiale + 24 * 60 : finInitiale;
  return Math.max(0, fin - debut - (avecPause ? 30 : 0));
}

function joursDuMois(mois: number, annee: number): JourPlanning[] {
  const nombre = new Date(annee, mois, 0).getDate();
  return Array.from({ length: nombre }, (_, index) => ({
    date: `${annee}-${String(mois).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
    matin: { heureDebut: "", heureFin: "" },
    soir: { heureDebut: "", heureFin: "" },
  }));
}

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, utilisateurs } = useUser();
  const [plannings, setPlannings] = useState<PlanningMensuel[]>([]);
  const [modeles, setModeles] = useState<PlanningRecurrence[]>([]);

  useEffect(() => { void charger(); void chargerModeles(); }, [entrepriseActive?.id]);

  async function charger() {
    if (!entrepriseActive) { setPlannings([]); return; }
    try {
      const stockage = await AsyncStorage.getItem(obtenirCleStockagePlannings(entrepriseActive.id));
      const liste = stockage ? JSON.parse(stockage) as PlanningMensuel[] : [];
      setPlannings(liste.filter((planning) => planning.entrepriseId === entrepriseActive.id));
    } catch (error) {
      console.error("Erreur chargement plannings", error);
      setPlannings([]);
    }
  }

  async function sauvegarder(liste: PlanningMensuel[]) {
    if (!entrepriseActive) return;
    const entreprise = liste.filter((planning) => planning.entrepriseId === entrepriseActive.id);
    setPlannings(entreprise);
    await AsyncStorage.setItem(obtenirCleStockagePlannings(entrepriseActive.id), JSON.stringify(entreprise));
  }

  async function chargerModeles() {
    if (!entrepriseActive) { setModeles([]); return; }
    try {
      const stockage = await AsyncStorage.getItem(obtenirCleStockagePlanningsRecurrents(entrepriseActive.id));
      const liste = stockage ? JSON.parse(stockage) as PlanningRecurrence[] : [];
      setModeles(liste.filter((modele) => modele.entrepriseId === entrepriseActive.id));
    } catch (error) {
      console.error("Erreur chargement modèles planning", error);
      setModeles([]);
    }
  }

  async function sauvegarderModeles(liste: PlanningRecurrence[]) {
    if (!entrepriseActive) return;
    const entreprise = liste.filter((modele) => modele.entrepriseId === entrepriseActive.id);
    setModeles(entreprise);
    await AsyncStorage.setItem(obtenirCleStockagePlanningsRecurrents(entrepriseActive.id), JSON.stringify(entreprise));
  }

  async function creerPlanning(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive || mois < 1 || mois > 12) return null;
    const existant = plannings.find((planning) => planning.mois === mois && planning.annee === annee);
    if (existant) return existant;
    const jours = joursDuMois(mois, annee);
    const planning: PlanningMensuel = {
      id: `${entrepriseActive.id}-${annee}-${String(mois).padStart(2, "0")}`,
      entrepriseId: entrepriseActive.id,
      mois, annee, statut: "BROUILLON",
      lignes: utilisateurs.filter((u) => u.entrepriseId === entrepriseActive.id && u.actif && u.role !== "GERANT").map((u) => ({
        utilisateurId: u.id, nom: u.nom, poste: u.poste ?? "", heuresContratHebdomadaires: 0,
        jours: jours.map((jour) => ({ ...jour, matin: { ...jour.matin }, soir: { ...jour.soir } })),
      })),
    };
    await sauvegarder([...plannings, planning]);
    return planning;
  }

  async function creerModelePlanning(modele: Omit<PlanningRecurrence, "id" | "entrepriseId">) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return null;
    const utilisateur = utilisateurs.find((u) => u.id === modele.utilisateurId && u.entrepriseId === entrepriseActive.id && u.actif);
    if (!utilisateur || modeles.some((element) => element.utilisateurId === modele.utilisateurId)) return null;
    const nouveau: PlanningRecurrence = {
      ...modele,
      id: `${entrepriseActive.id}-${modele.utilisateurId}-${Date.now()}`,
      entrepriseId: entrepriseActive.id,
    };
    await sauvegarderModeles([...modeles, nouveau]);
    return nouveau;
  }

  async function modifierModelePlanning(id: string, modifications: Partial<Omit<PlanningRecurrence, "id" | "entrepriseId" | "utilisateurId">>) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return false;
    const existe = modeles.some((modele) => modele.id === id && modele.entrepriseId === entrepriseActive.id);
    if (!existe) return false;
    await sauvegarderModeles(modeles.map((modele) => modele.id === id ? { ...modele, ...modifications } : modele));
    return true;
  }

  function obtenirModeleEntreprise() {
    if (utilisateurActif?.role !== "GERANT") return [];
    return modeles.filter((modele) => modele.entrepriseId === entrepriseActive?.id);
  }

  async function genererPlanningMois(mois: number, annee: number) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive || mois < 1 || mois > 12) return null;
    const existant = plannings.find((planning) => planning.mois === mois && planning.annee === annee);
    if (existant) return existant;
    const joursVides = joursDuMois(mois, annee);
    const lignes: LignePlanningMensuel[] = utilisateurs
      .filter((u) => u.entrepriseId === entrepriseActive.id && u.actif && u.role !== "GERANT")
      .map((utilisateur) => {
        const modele = modeles.find((element) => element.utilisateurId === utilisateur.id && element.actif);
        const dernierContrat = [...plannings]
          .sort((a, b) => b.annee - a.annee || b.mois - a.mois)
          .map((planning) => planning.lignes.find((ligne) => ligne.utilisateurId === utilisateur.id)?.heuresContratHebdomadaires)
          .find((heures) => heures !== undefined) ?? 0;
        return {
          utilisateurId: utilisateur.id,
          nom: utilisateur.nom,
          poste: modele?.poste || utilisateur.poste || "",
          heuresContratHebdomadaires: dernierContrat,
          jours: joursVides.map((jour) => {
            const index = new Date(`${jour.date}T12:00:00`).getDay();
            const nomJour = JOURS_SEMAINE_PLANNING[(index + 6) % 7];
            const recurrence = modele?.semaine[nomJour];
            return recurrence
              ? { ...recurrence, date: jour.date, matin: { ...recurrence.matin }, soir: { ...recurrence.soir } }
              : { ...jour, matin: { ...jour.matin }, soir: { ...jour.soir } };
          }),
        };
      });
    const planning: PlanningMensuel = {
      id: `${entrepriseActive.id}-${annee}-${String(mois).padStart(2, "0")}`,
      entrepriseId: entrepriseActive.id,
      mois, annee, statut: "BROUILLON", lignes,
    };
    await sauvegarder([...plannings, planning]);
    return planning;
  }

  async function modifierPlanning(id: string, modifications: Partial<Pick<PlanningMensuel, "lignes">>) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return false;
    const planning = plannings.find((p) => p.id === id && p.entrepriseId === entrepriseActive.id);
    if (!planning || planning.statut === "VALIDE") return false;
    await sauvegarder(plannings.map((p) => p.id === id ? { ...p, ...modifications } : p));
    return true;
  }

  async function validerPlanning(id: string) {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return false;
    const existe = plannings.some((p) => p.id === id && p.entrepriseId === entrepriseActive.id);
    if (!existe) return false;
    await sauvegarder(plannings.map((p) => p.id === id ? { ...p, statut: "VALIDE" as const, dateValidation: new Date().toISOString() } : p));
    return true;
  }

  function obtenirPlanningEntreprise(mois: number, annee: number) {
    if (!hasPermission(utilisateurActif, "consultationValidationsHeures")) return undefined;
    return plannings.find((p) => p.entrepriseId === entrepriseActive?.id && p.mois === mois && p.annee === annee);
  }

  function obtenirPlanningUtilisateur(utilisateurId = utilisateurActif?.id, mois = new Date().getMonth() + 1, annee = new Date().getFullYear()) {
    if (!utilisateurId) return undefined;
    const planning = plannings.find((p) => p.entrepriseId === entrepriseActive?.id && p.mois === mois && p.annee === annee);
    const ligne = planning?.lignes.find((element) => element.utilisateurId === utilisateurId);
    return planning && ligne ? { planning, ligne } : undefined;
  }

  function calculerHeures(ligne: LignePlanningMensuel, baseContrat: "MENSUELLE" | "HEBDOMADAIRE" = "MENSUELLE"): CalculHeuresPlanning {
    const brut = ligne.jours.reduce((total, jour) => total + dureePeriode(jour.matin, false) + dureePeriode(jour.soir, false), 0);
    const net = ligne.jours.reduce((total, jour) => total + dureePeriode(jour.matin, true) + dureePeriode(jour.soir, true), 0);
    const contrat = baseContrat === "HEBDOMADAIRE"
      ? ligne.heuresContratHebdomadaires
      : ligne.heuresContratHebdomadaires * 52 / 12;
    return {
      heuresPrevues: Math.round((brut / 60) * 100) / 100,
      heuresCalculees: Math.round((net / 60) * 100) / 100,
      heuresContratMensuelles: Math.round(contrat * 100) / 100,
      ecartContrat: Math.round((net / 60 - contrat) * 100) / 100,
    };
  }

  function obtenirComparaisonPlanningPointage(date: string, pointages: Pointage[]): TempsTravail[] {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const [annee, mois] = date.split("-").map(Number);
    const planning = plannings.find((element) => element.entrepriseId === entrepriseActive.id && element.mois === mois && element.annee === annee);
    if (!planning) return [];
    const pointagesEntreprise = pointages.filter((pointage) => pointage.entrepriseId === entrepriseActive.id && pointage.date === date);
    return planning.lignes.flatMap((ligne) => {
      const jour = ligne.jours.find((element) => element.date === date);
      if (!jour) return [];
      return [construireComparaisonTemps({ entrepriseId: entrepriseActive.id, utilisateurId: ligne.utilisateurId, date, jour, pointages: pointagesEntreprise.filter((pointage) => pointage.utilisateurId === ligne.utilisateurId) })];
    });
  }

  return <PlanningContext.Provider value={{ creerPlanning, modifierPlanning, validerPlanning, obtenirPlanningEntreprise, obtenirPlanningUtilisateur, calculerHeures, creerModelePlanning, modifierModelePlanning, genererPlanningMois, obtenirModeleEntreprise, obtenirComparaisonPlanningPointage }}>{children}</PlanningContext.Provider>;
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) throw new Error("usePlanning doit être utilisé dans PlanningProvider");
  return context;
}
