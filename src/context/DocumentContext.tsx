import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { obtenirCleNotificationsDocuments } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { obtenirDocumentsAlerte, obtenirJoursAvantExpiration } from "@/services/documentAlerteService";
import {
  ajouterDocumentSalarie,
  modifierDocumentSalarie,
  obtenirDocumentsSalarie,
  supprimerDocumentSalarie,
  type ModificationDocumentSalarie,
  type NouveauDocumentSalarie,
} from "@/services/documentService";
import type { AlerteDocument, DocumentSalarie } from "@/types/documentSalarie";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

type DocumentContextType = {
  documents: DocumentSalarie[];
  ajouterDocument: (document: NouveauDocumentSalarie) => Promise<DocumentSalarie | null>;
  modifierDocument: (id: string, modifications: ModificationDocumentSalarie) => Promise<boolean>;
  supprimerDocument: (id: string) => Promise<boolean>;
  obtenirDocumentsSalaries: (utilisateurId?: string) => DocumentSalarie[];
  obtenirAlertesDocuments: () => AlerteDocument[];
  actualiserDocuments: () => Promise<void>;
};

const DocumentContext = createContext<DocumentContextType | null>(null);

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, utilisateurs } = useUser();
  const [documents, setDocuments] = useState<DocumentSalarie[]>([]);

  const actualiserDocuments = useCallback(async () => {
    if (!entrepriseActive || !utilisateurActif) { setDocuments([]); return; }
    const cibles = utilisateurActif.role === "GERANT"
      ? utilisateurs.filter((utilisateur) => utilisateur.entrepriseId === entrepriseActive.id && utilisateur.role !== "GERANT")
      : [utilisateurActif];
    const listes = await Promise.all(cibles.map((salarie) => obtenirDocumentsSalarie(utilisateurActif, salarie)));
    setDocuments(listes.flat());
  }, [entrepriseActive, utilisateurActif, utilisateurs]);

  useEffect(() => { void actualiserDocuments(); }, [actualiserDocuments]);

  const alertes = useMemo<AlerteDocument[]>(() => obtenirDocumentsAlerte(documents)
    .map((document) => {
      const jours = obtenirJoursAvantExpiration(document);
      if (jours === null) return null;
      const niveau = jours < 0 ? "EXPIRE" as const : "A_SURVEILLER" as const;
      const message = niveau === "EXPIRE"
        ? "⚠️ Action nécessaire. Ce document salarié est arrivé à expiration."
        : "👑 L’Empire veille sur vos documents. Ce document arrive bientôt à expiration.";
      return { document, joursAvantExpiration: jours, niveau, message };
    })
    .filter((alerte): alerte is AlerteDocument => alerte !== null)
    .sort((a, b) => a.joursAvantExpiration - b.joursAvantExpiration), [documents]);

  useEffect(() => {
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return;
    void notifierEcheances(alertes, utilisateurs, entrepriseActive.id);
  }, [alertes, entrepriseActive, utilisateurActif?.role, utilisateurs]);

  async function ajouterDocument(document: NouveauDocumentSalarie) {
    if (!utilisateurActif) return null;
    const resultat = await ajouterDocumentSalarie(utilisateurActif, document);
    if (resultat) await actualiserDocuments();
    return resultat;
  }

  async function modifierDocument(id: string, modifications: ModificationDocumentSalarie) {
    if (!utilisateurActif) return false;
    const resultat = await modifierDocumentSalarie(utilisateurActif, id, modifications);
    if (resultat) await actualiserDocuments();
    return resultat;
  }

  async function supprimerDocument(id: string) {
    if (!utilisateurActif) return false;
    const resultat = await supprimerDocumentSalarie(utilisateurActif, id);
    if (resultat) await actualiserDocuments();
    return resultat;
  }

  function obtenirDocumentsSalaries(utilisateurId?: string) {
    return utilisateurId ? documents.filter((document) => document.utilisateurId === utilisateurId) : documents;
  }

  return <DocumentContext.Provider value={{ documents, ajouterDocument, modifierDocument, supprimerDocument, obtenirDocumentsSalaries, obtenirAlertesDocuments: () => alertes, actualiserDocuments }}>{children}</DocumentContext.Provider>;
}

async function notifierEcheances(alertes: AlerteDocument[], utilisateurs: ReturnType<typeof useUser>["utilisateurs"], entrepriseId: string) {
  const aNotifier = alertes.filter((alerte) => alerte.joursAvantExpiration === 30 || alerte.niveau === "EXPIRE");
  if (aNotifier.length === 0) return;
  const cle = obtenirCleNotificationsDocuments(entrepriseId);
  const dejaEnvoyees = JSON.parse(await AsyncStorage.getItem(cle) ?? "[]") as string[];
  const nouvelles = aNotifier.filter((alerte) => {
    const seuil = alerte.niveau === "EXPIRE" ? "expiration" : String(alerte.joursAvantExpiration);
    return !dejaEnvoyees.includes(`${alerte.document.id}:${seuil}`);
  });
  if (nouvelles.length === 0) return;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync("documents", { name: "Échéances documentaires", importance: Notifications.AndroidImportance.HIGH });
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;
  for (const alerte of nouvelles) {
    const salarie = utilisateurs.find((utilisateur) => utilisateur.id === alerte.document.utilisateurId);
    const prenom = salarie?.nom.trim().split(/\s+/)[0] ?? "ce salarié";
    const estExpiration = alerte.niveau === "EXPIRE";
    const title = estExpiration ? "⚠️ Action nécessaire" : "👑 L’Empire veille sur vos documents";
    const body = estExpiration
      ? `Le document de ${prenom} est arrivé à expiration.`
      : `Le document de ${prenom} arrive bientôt à expiration.`;
    await Notifications.scheduleNotificationAsync({ content: { title, body, data: { url: "/personnel/documents-alertes", documentId: alerte.document.id } }, trigger: null });
    const seuil = alerte.niveau === "EXPIRE" ? "expiration" : String(alerte.joursAvantExpiration);
    dejaEnvoyees.push(`${alerte.document.id}:${seuil}`);
  }
  await AsyncStorage.setItem(cle, JSON.stringify(dejaEnvoyees));
}

export function useDocuments() {
  const contexte = useContext(DocumentContext);
  if (!contexte) throw new Error("useDocuments doit être utilisé dans DocumentProvider");
  return contexte;
}
