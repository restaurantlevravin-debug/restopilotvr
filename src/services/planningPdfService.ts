import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Entreprise } from "@/types/entreprise";
import type { CalculHeuresPlanning, PlanningMensuel } from "@/types/planning";

type ExportPlanning = {
  entreprise: Entreprise;
  planning: PlanningMensuel;
  calculerHeures: (ligne: PlanningMensuel["lignes"][number]) => CalculHeuresPlanning;
};

function html(valeur: string | number) {
  return String(valeur).replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[caractere] ?? caractere);
}

export async function exportPlanningPDF({ entreprise, planning, calculerHeures }: ExportPlanning) {
  const lignes = planning.lignes.map((ligne) => {
    const calcul = calculerHeures(ligne);
    const jours = ligne.jours.filter((jour) => jour.matin.heureDebut || jour.soir.heureDebut || jour.remarque).map((jour) =>
      `<div><b>${html(jour.date)}</b> — Midi ${html(jour.matin.heureDebut || "—")}-${html(jour.matin.heureFin || "—")} · Soir ${html(jour.soir.heureDebut || "—")}-${html(jour.soir.heureFin || "—")}${jour.remarque ? ` · ${html(jour.remarque)}` : ""}</div>`
    ).join("");
    return `<section><h2>${html(ligne.nom)} — ${html(ligne.poste || "Poste non renseigné")}</h2><p>Contrat : ${html(ligne.heuresContratHebdomadaires)} h/semaine · Total net : ${html(calcul.heuresCalculees)} h · Heures supplémentaires estimées : ${html(Math.max(0, calcul.ecartContrat))} h</p>${jours || "<p>Aucun horaire prévu.</p>"}</section>`;
  }).join("");
  const document = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:24px;color:#222}header{border-bottom:3px solid #9b7427}section{break-inside:avoid;border-bottom:1px solid #ddd;padding:10px 0}h1{color:#70500f}h2{font-size:16px;margin-bottom:4px}p,div{font-size:11px;line-height:1.5}</style></head><body><header><h1>Planning mensuel — ${html(entreprise.nom)}</h1><p>${html(planning.mois)}/${html(planning.annee)} · ${html(planning.statut)}</p></header>${lignes}</body></html>`;
  const fichier = await Print.printToFileAsync({ html: document });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(fichier.uri, { mimeType: "application/pdf", dialogTitle: "Exporter le planning comptable" });
  return fichier.uri;
}
