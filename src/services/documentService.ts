import AsyncStorage from "@react-native-async-storage/async-storage";

import { obtenirCleStockageDocumentsSalaries } from "@/constants/storage";
import { verifierAlertesDocuments } from "@/services/documentAlerteService";
import type { DocumentSalarie, DossierSalarieExport } from "@/types/documentSalarie";
import type { Utilisateur } from "@/types/entreprise";

export type NouveauDocumentSalarie = Omit<DocumentSalarie, "id" | "dateAjout" | "ajoutePar" | "statut">;
export type ModificationDocumentSalarie = Partial<Pick<DocumentSalarie, "nom" | "categorie" | "commentaire" | "dateExpiration">>;

function estGerantEntreprise(acteur: Utilisateur, entrepriseId: string) {
  return acteur.role === "GERANT" && acteur.entrepriseId === entrepriseId;
}

async function lireDocuments(entrepriseId: string): Promise<DocumentSalarie[]> {
  const brut = await AsyncStorage.getItem(obtenirCleStockageDocumentsSalaries(entrepriseId));
  const documents = brut ? JSON.parse(brut) as DocumentSalarie[] : [];
  return documents.filter((document) => document.entrepriseId === entrepriseId).map((document) => ({
    ...document,
    statut: verifierAlertesDocuments(document),
  }));
}

async function sauvegarderDocuments(entrepriseId: string, documents: DocumentSalarie[]) {
  await AsyncStorage.setItem(
    obtenirCleStockageDocumentsSalaries(entrepriseId),
    JSON.stringify(documents.filter((document) => document.entrepriseId === entrepriseId)),
  );
}

export async function ajouterDocumentSalarie(
  acteur: Utilisateur,
  document: NouveauDocumentSalarie,
): Promise<DocumentSalarie | null> {
  if (!estGerantEntreprise(acteur, document.entrepriseId) || !document.fileUri.trim()) return null;
  const documents = await lireDocuments(document.entrepriseId);
  const nouveau: DocumentSalarie = {
    ...document,
    id: `${document.entrepriseId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    dateAjout: new Date().toISOString(),
    ajoutePar: acteur.id,
    statut: verifierAlertesDocuments(document),
  };
  await sauvegarderDocuments(document.entrepriseId, [...documents, nouveau]);
  return nouveau;
}

export async function modifierDocumentSalarie(
  acteur: Utilisateur,
  documentId: string,
  modifications: ModificationDocumentSalarie,
): Promise<boolean> {
  if (!estGerantEntreprise(acteur, acteur.entrepriseId)) return false;
  const documents = await lireDocuments(acteur.entrepriseId);
  if (!documents.some((document) => document.id === documentId)) return false;
  await sauvegarderDocuments(acteur.entrepriseId, documents.map((document) =>
    document.id === documentId
      ? { ...document, ...modifications, statut: verifierAlertesDocuments({ ...document, ...modifications }) }
      : document
  ));
  return true;
}

export async function supprimerDocumentSalarie(
  acteur: Utilisateur,
  documentId: string,
): Promise<boolean> {
  if (!estGerantEntreprise(acteur, acteur.entrepriseId)) return false;
  const documents = await lireDocuments(acteur.entrepriseId);
  const document = documents.find((element) => element.id === documentId);
  if (!document) return false;
  await sauvegarderDocuments(acteur.entrepriseId, documents.filter((element) => element.id !== documentId));
  return true;
}

export async function obtenirDocumentsSalarie(
  acteur: Utilisateur,
  salarie: Utilisateur,
): Promise<DocumentSalarie[]> {
  const memeEntreprise = acteur.entrepriseId === salarie.entrepriseId;
  const consultationPropre = acteur.id === salarie.id && salarie.consultationDocumentsAutorisee === true;
  if (!memeEntreprise || (acteur.role !== "GERANT" && !consultationPropre)) return [];
  const documents = await lireDocuments(salarie.entrepriseId);
  return documents.filter((document) => document.utilisateurId === salarie.id);
}

export async function preparerExportDossierSalarie(
  acteur: Utilisateur,
  salarie: Utilisateur,
): Promise<DossierSalarieExport | null> {
  if (!estGerantEntreprise(acteur, salarie.entrepriseId)) return null;
  return {
    entrepriseId: salarie.entrepriseId,
    utilisateurId: salarie.id,
    informations: {
      nom: salarie.nom,
      poste: salarie.poste,
      contrat: salarie.contrat,
      heuresContractuelles: salarie.heuresContractuelles,
    },
    documents: await obtenirDocumentsSalarie(acteur, salarie),
    genereLe: new Date().toISOString(),
  };
}
