import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Entreprise } from "@/types/entreprise";
import type { SyntheseHeuresMois, ValidationHeuresMensuelle } from "@/types/validationHeures";
import { formaterHeuresPDF } from "@/services/heuresService";

function echapper(valeur: string | number) { return String(valeur).replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[caractere] ?? caractere); }
export async function exporterHeuresPDF({ entreprise, validation, synthese, validateurNom }: { entreprise: Entreprise; validation: ValidationHeuresMensuelle; synthese: SyntheseHeuresMois; validateurNom?: string }) {
  if (validation.entrepriseId !== entreprise.id || synthese.entrepriseId !== entreprise.id) throw new Error("Données d’entreprise incompatibles");
  if (validation.statut !== "VALIDEE") throw new Error("Le mois doit être validé avant export");
  const mois = new Date(validation.annee, validation.mois - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const lignes = synthese.lignes.map((ligne) => `<tr><td>${echapper(ligne.nom)}</td><td>${echapper(ligne.poste || "—")}</td><td>${echapper(ligne.contratHebdomadaire)} h</td><td>${formaterHeuresPDF(ligne.heuresPrevuesMinutes)}</td><td>${formaterHeuresPDF(ligne.heuresRealiseesMinutes)}</td><td>${formaterHeuresPDF(ligne.heuresSupplementairesMinutes)}</td><td>${echapper(ligne.remarque || "—")}</td></tr>`).join("");
  const document = `<!doctype html><html><head><meta charset="utf-8"><style>@page{margin:24px}body{font-family:Arial;color:#222}header{border-bottom:3px solid #9b7427;margin-bottom:18px}h1{color:#70500f}table{width:100%;border-collapse:collapse;font-size:10px}th{background:#2a2114;color:#fff}th,td{border:1px solid #ccc;padding:7px;text-align:left}footer{border-top:1px solid #bbb;margin-top:22px;padding-top:12px;font-size:11px;color:#444}.note{background:#f5f1e8;padding:10px;margin-top:15px}</style></head><body><header><h1>Validation des heures — ${echapper(entreprise.nom)}</h1><p>Mois concerné : ${echapper(mois)}</p><p>Date d’export : ${echapper(new Date().toLocaleString("fr-FR"))}</p></header><table><thead><tr><th>Nom</th><th>Poste</th><th>Contrat</th><th>Heures prévues</th><th>Heures réalisées</th><th>Heures supplémentaires détectées</th><th>Remarques</th></tr></thead><tbody>${lignes}</tbody></table>${validation.commentaire ? `<p class="note"><strong>Commentaire général :</strong> ${echapper(validation.commentaire)}</p>` : ""}<footer><p><strong>Validé par :</strong> ${echapper(validateurNom || validation.validePar || "—")}</p><p><strong>Date de validation :</strong> ${validation.dateValidation ? echapper(new Date(validation.dateValidation).toLocaleString("fr-FR")) : "—"}</p><p>Document de contrôle comptable. Les heures supplémentaires sont détectées mais ne déclenchent aucun calcul de paie.</p></footer></body></html>`;
  const fichier = await Print.printToFileAsync({ html: document });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fichier.uri, { mimeType: "application/pdf", dialogTitle: "Exporter les heures comptables" });
  return fichier.uri;
}
