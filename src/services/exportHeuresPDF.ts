import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Entreprise } from "@/types/entreprise";
import type { SyntheseHeuresMois, ValidationHeuresMensuelle } from "@/types/validationHeures";

function echapper(valeur: string | number) { return String(valeur).replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[caractere] ?? caractere); }
function heures(minutes: number) { return `${Math.floor(Math.abs(minutes) / 60)}h${String(Math.abs(minutes) % 60).padStart(2, "0")}`; }

export async function exporterHeuresPDF({ entreprise, validation, synthese }: { entreprise: Entreprise; validation: ValidationHeuresMensuelle; synthese: SyntheseHeuresMois }) {
  if (validation.entrepriseId !== entreprise.id || synthese.entrepriseId !== entreprise.id) throw new Error("Données d’entreprise incompatibles");
  const lignes = synthese.lignes.map((ligne) => `<tr><td>${echapper(ligne.nom)}</td><td>${echapper(ligne.poste || "—")}</td><td>${echapper(ligne.contratHebdomadaire)} h</td><td>${heures(ligne.heuresPrevuesMinutes)}</td><td>${heures(ligne.heuresRealiseesMinutes)}</td><td>${heures(ligne.heuresSupplementairesMinutes)}</td><td>${echapper(ligne.remarque || "—")}</td></tr>`).join("");
  const document = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:24px}body{font-family:Arial;color:#222}header{border-bottom:3px solid #9b7427;margin-bottom:18px}h1{color:#70500f}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#2a2114;color:#fff}th,td{border:1px solid #ccc;padding:7px;text-align:left}footer{margin-top:18px;font-size:10px;color:#666}</style></head><body><header><h1>Validation des heures — ${echapper(entreprise.nom)}</h1><p>Période : ${echapper(validation.mois)}/${echapper(validation.annee)} · Statut : ${echapper(validation.statut)}</p><p>Date d’export : ${echapper(new Date().toLocaleString("fr-FR"))}</p></header><table><thead><tr><th>Nom</th><th>Poste</th><th>Contrat</th><th>Prévues</th><th>Réalisées</th><th>Supplémentaires</th><th>Remarques</th></tr></thead><tbody>${lignes}</tbody></table><footer>Document préparé pour export comptable, paie et archivage. Aucun calcul de rémunération n’est effectué.</footer></body></html>`;
  const fichier = await Print.printToFileAsync({ html: document });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fichier.uri, { mimeType: "application/pdf", dialogTitle: "Exporter les heures comptables" });
  return fichier.uri;
}
