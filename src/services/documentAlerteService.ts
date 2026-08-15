import type { DocumentSalarie, StatutDocumentSalarie } from "@/types/documentSalarie";

const JOUR_MS = 24 * 60 * 60 * 1000;

function debutJour(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function obtenirJoursAvantExpiration(
  document: Pick<DocumentSalarie, "dateExpiration">,
  reference = new Date(),
): number | null {
  if (!document.dateExpiration) return null;
  const expiration = new Date(`${document.dateExpiration}T12:00:00`);
  if (Number.isNaN(expiration.getTime())) return null;
  return Math.ceil((debutJour(expiration) - debutJour(reference)) / JOUR_MS);
}

export function verifierAlertesDocuments(
  document: Pick<DocumentSalarie, "dateExpiration">,
  reference = new Date(),
): StatutDocumentSalarie {
  const jours = obtenirJoursAvantExpiration(document, reference);
  if (jours === null || jours > 30) return "VALIDE";
  return jours < 0 ? "EXPIRE" : "A_SURVEILLER";
}

export function obtenirDocumentsAlerte(
  documents: DocumentSalarie[],
  reference = new Date(),
): DocumentSalarie[] {
  return documents
    .map((document) => ({ ...document, statut: verifierAlertesDocuments(document, reference) }))
    .filter((document) => document.statut !== "VALIDE")
    .sort((a, b) => (a.dateExpiration ?? "").localeCompare(b.dateExpiration ?? ""));
}
