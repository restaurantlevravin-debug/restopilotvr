import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { obtenirCleStockageAnomaliesHaccp } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useRewards } from "@/context/RewardContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import type { AnomalieHaccp } from "@/types/anomalieHaccp";
import type { IdentiteValidation } from "@/types/validation";

type NouvelleAnomalie = Omit<AnomalieHaccp, "id" | "entrepriseId" | "utilisateurDeclarationId" | "dateCreation" | "heureCreation" | "responsableValidationId" | "dateValidation" | "dateCloture" | "statut">;

type AnomalieHaccpContextType = {
  anomalies: AnomalieHaccp[];
  creerAnomalie: (anomalie: NouvelleAnomalie) => Promise<AnomalieHaccp | null>;
  ajouterActionCorrective: (id: string, actionCorrective: string) => Promise<boolean>;
  validerCorrection: (id: string, identite: IdentiteValidation) => Promise<boolean>;
  cloturerAnomalie: (id: string) => Promise<boolean>;
  obtenirAnomaliesOuvertes: () => AnomalieHaccp[];
};

const AnomalieHaccpContext = createContext<AnomalieHaccpContextType | null>(null);
const ROLES_RESPONSABLES = new Set(["GERANT", "CHEF_CUISINE", "MAITRE_HOTEL"]);

function dateLocale(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AnomalieHaccpProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, utilisateurs } = useUser();
  const { validerAction } = useValidation();
  const { ajouterProgression } = useRewards();
  const [anomalies, setAnomalies] = useState<AnomalieHaccp[]>([]);

  useEffect(() => { void charger(); }, [entrepriseActive?.id]);

  async function charger() {
    if (!entrepriseActive) { setAnomalies([]); return; }
    try {
      const stockage = await AsyncStorage.getItem(obtenirCleStockageAnomaliesHaccp(entrepriseActive.id));
      const liste = stockage ? JSON.parse(stockage) as AnomalieHaccp[] : [];
      setAnomalies(liste.filter((a) => a.entrepriseId === entrepriseActive.id));
    } catch (error) {
      console.error("Erreur chargement anomalies HACCP", error);
      setAnomalies([]);
    }
  }

  async function sauvegarder(liste: AnomalieHaccp[]) {
    if (!entrepriseActive) return;
    const listeEntreprise = liste.filter((a) => a.entrepriseId === entrepriseActive.id);
    setAnomalies(listeEntreprise);
    await AsyncStorage.setItem(obtenirCleStockageAnomaliesHaccp(entrepriseActive.id), JSON.stringify(listeEntreprise));
  }

  async function creerAnomalie(anomalie: NouvelleAnomalie) {
    if (!entrepriseActive || !utilisateurActif || !anomalie.type.trim() || !anomalie.description.trim() || !anomalie.photo.trim()) return null;
    const maintenant = new Date();
    const nouvelle: AnomalieHaccp = {
      ...anomalie,
      type: anomalie.type.trim(),
      description: anomalie.description.trim(),
      actionCorrective: anomalie.actionCorrective?.trim() || undefined,
      id: `${maintenant.getTime()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId: entrepriseActive.id,
      utilisateurDeclarationId: utilisateurActif.id,
      dateCreation: dateLocale(maintenant),
      heureCreation: maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      statut: anomalie.actionCorrective?.trim() ? "EN_TRAITEMENT" : "OUVERTE",
    };
    await sauvegarder([...anomalies, nouvelle]);
    return nouvelle;
  }

  async function ajouterActionCorrective(id: string, actionCorrective: string) {
    const anomalie = anomalies.find((a) => a.id === id);
    if (!anomalie || !utilisateurActif || !actionCorrective.trim() || anomalie.statut === "CLOTUREE") return false;
    if (utilisateurActif.id !== anomalie.utilisateurDeclarationId && !ROLES_RESPONSABLES.has(utilisateurActif.role)) return false;
    await sauvegarder(anomalies.map((a) => a.id === id ? { ...a, actionCorrective: actionCorrective.trim(), statut: "EN_TRAITEMENT" as const } : a));
    return true;
  }

  async function validerCorrection(id: string, identite: IdentiteValidation) {
    const anomalie = anomalies.find((a) => a.id === id);
    if (!anomalie || !anomalie.actionCorrective || !["OUVERTE", "EN_TRAITEMENT"].includes(anomalie.statut)) return false;
    const candidats = identite.methodeValidation === "CLIC"
      ? utilisateurs.filter((u) => u.id === identite.utilisateurId)
      : utilisateurs.filter((u) => (u.pinValidation ?? u.pin) === identite.pin);
    if (candidats.length !== 1 || candidats[0].id === anomalie.utilisateurDeclarationId || !ROLES_RESPONSABLES.has(candidats[0].role)) return false;
    const validation = await validerAction({ actionType: "HACCP_ANOMALIE", actionId: id, ...identite });
    if (!validation || validation.valideParUtilisateurId === anomalie.utilisateurDeclarationId || !ROLES_RESPONSABLES.has(validation.valideParRole)) return false;
    await sauvegarder(anomalies.map((a) => a.id === id ? { ...a, responsableValidationId: validation.valideParUtilisateurId, dateValidation: `${validation.dateValidation}T${validation.heureValidation}`, statut: "VALIDEE" as const } : a));
    await ajouterProgression({ utilisateurId: anomalie.utilisateurDeclarationId, entrepriseId: anomalie.entrepriseId, typeAction: "ACTION_CORRECTIVE_VALIDEE", conformite: true, validation: true });
    return true;
  }

  async function cloturerAnomalie(id: string) {
    const anomalie = anomalies.find((a) => a.id === id);
    if (!anomalie || anomalie.statut !== "VALIDEE" || !utilisateurActif || !ROLES_RESPONSABLES.has(utilisateurActif.role) || utilisateurActif.id === anomalie.utilisateurDeclarationId) return false;
    await sauvegarder(anomalies.map((a) => a.id === id ? { ...a, statut: "CLOTUREE" as const, dateCloture: new Date().toISOString() } : a));
    return true;
  }

  function obtenirAnomaliesOuvertes() {
    return anomalies.filter((a) => a.statut !== "CLOTUREE");
  }

  return <AnomalieHaccpContext.Provider value={{ anomalies, creerAnomalie, ajouterActionCorrective, validerCorrection, cloturerAnomalie, obtenirAnomaliesOuvertes }}>{children}</AnomalieHaccpContext.Provider>;
}

export function useAnomaliesHaccp() {
  const context = useContext(AnomalieHaccpContext);
  if (!context) throw new Error("useAnomaliesHaccp doit être utilisé dans AnomalieHaccpProvider");
  return context;
}
