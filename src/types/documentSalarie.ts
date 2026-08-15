export const CATEGORIES_DOCUMENT_SALARIE = [
  "CONTRAT",
  "AVENANT",
  "IDENTITE",
  "DIPLOME",
  "FORMATION",
  "HACCP",
  "ARRET_TRAVAIL",
  "AUTRE",
] as const;

export type CategorieDocumentSalarie = typeof CATEGORIES_DOCUMENT_SALARIE[number];
export type StatutDocumentSalarie = "VALIDE" | "A_SURVEILLER" | "EXPIRE";

export type DocumentSalarie = {
  id: string;
  entrepriseId: string;
  utilisateurId: string;
  nom: string;
  categorie: CategorieDocumentSalarie;
  /** Nom original du fichier, conservé comme métadonnée. */
  fichier: string;
  /** Référence locale aujourd'hui, URL serveur demain. Aucun contenu binaire n'est stocké ici. */
  fileUri: string;
  dateAjout: string;
  ajoutePar: string;
  commentaire?: string;
  dateExpiration?: string;
  statut: StatutDocumentSalarie;
};

export type AlerteDocument = {
  document: DocumentSalarie;
  joursAvantExpiration: number;
  niveau: "A_SURVEILLER" | "EXPIRE";
  message: string;
};

export type DossierSalarieExport = {
  entrepriseId: string;
  utilisateurId: string;
  informations: {
    nom: string;
    poste?: string;
    contrat?: string;
    heuresContractuelles?: number;
  };
  documents: DocumentSalarie[];
  genereLe: string;
};
