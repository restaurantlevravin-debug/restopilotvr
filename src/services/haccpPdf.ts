import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { ActionCorrective, ReleveTemperature, ScoreHaccp, TraceabiliteProduit } from "@/context/HaccpContext";

const NOM_RESTAURANT_PAR_DEFAUT = "RestoPilotVR";

export type OptionsExportHaccp = {
  nomRestaurant?: string;
  periode?: string;
  // Réservés aux futures signatures, envois email et archivages mensuels.
  signatureResponsable?: string;
  destinataireEmail?: string;
  archivageMensuel?: boolean;
};

type DonneesExportHaccp = {
  releves: ReleveTemperature[];
  traces: TraceabiliteProduit[];
  actions: ActionCorrective[];
  scoreHaccp: ScoreHaccp;
};

function echapperHtml(valeur: string | number | undefined) {
  return String(valeur ?? "").replace(/[&<>'"]/g, (caractere) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[caractere] ?? caractere);
}

async function imageBase64(uri?: string) {
  if (!uri) {
    return "";
  }

  if (uri.startsWith("data:image/")) {
    return uri;
  }

  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return uri;
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return "";
  }
}

function photoHtml(image: string, libelle: string) {
  return image ? `<div class="photo"><p>${echapperHtml(libelle)}</p><img src="${image}" alt="${echapperHtml(libelle)}" /></div>` : "";
}

function documentHtml(titre: string, contenu: string, options: OptionsExportHaccp) {
  const restaurant = options.nomRestaurant ?? NOM_RESTAURANT_PAR_DEFAUT;
  const periode = options.periode ?? "Toutes les données enregistrées";
  const genereLe = new Date().toLocaleString("fr-FR");

  return `<!DOCTYPE html>
  <html><head><meta charset="utf-8" /><style>
    @page { margin: 18mm 14mm; }
    * { box-sizing: border-box; }
    body { color: #263238; font-family: Arial, Helvetica, sans-serif; font-size: 10px; }
    .header { border-bottom: 3px solid #00695c; display: flex; justify-content: space-between; margin-bottom: 18px; padding-bottom: 10px; }
    .logo { color: #00695c; font-size: 21px; font-weight: 700; }
    .logo span { background: #00695c; border-radius: 50%; color: #fff; display: inline-block; font-size: 10px; margin-right: 7px; padding: 5px 3px; vertical-align: middle; }
    .meta { color: #566; line-height: 1.6; text-align: right; }
    h1 { color: #00695c; font-size: 20px; margin: 0 0 8px; }
    h2 { background: #e8f3f1; border-left: 4px solid #b08d57; color: #00695c; font-size: 14px; margin: 22px 0 10px; padding: 8px; }
    h3 { color: #00695c; font-size: 12px; margin: 14px 0 6px; }
    table { border-collapse: collapse; margin: 10px 0 16px; page-break-inside: auto; width: 100%; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    th { background: #00695c; color: #fff; font-size: 9px; text-align: left; }
    th, td { border: 1px solid #cfd8dc; padding: 6px; vertical-align: top; }
    .ok { color: #00695c; font-weight: 700; }
    .ko { color: #b3261e; font-weight: 700; }
    .summary { background: #f4f8f7; border-radius: 6px; line-height: 1.8; margin-top: 12px; padding: 10px; }
    .photo { margin: 8px 0 14px; page-break-inside: avoid; }
    .photo p { font-weight: 700; margin: 0 0 4px; }
    .photo img { border: 1px solid #cfd8dc; max-height: 180px; max-width: 260px; object-fit: contain; }
    .record { border-bottom: 1px solid #cfd8dc; page-break-inside: avoid; padding: 10px 0; }
    .footer { color: #78909c; font-size: 8px; margin-top: 24px; text-align: center; }
  </style></head><body>
    <div class="header"><div><div class="logo"><span>RP</span>RestoPilot</div><strong>${echapperHtml(restaurant)}</strong></div><div class="meta">Période : ${echapperHtml(periode)}<br />Généré le : ${echapperHtml(genereLe)}</div></div>
    <h1>${echapperHtml(titre)}</h1>${contenu}
    <div class="footer">Document HACCP - RestoPilot - À conserver dans le registre sanitaire</div>
  </body></html>`;
}

async function genererEtPartagerPdf(titre: string, contenu: string, options: OptionsExportHaccp) {
  const html = documentHtml(titre, contenu, options);
  const resultat = await Print.printToFileAsync({ html });

  if (Platform.OS !== "web" && await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(resultat.uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: titre,
    });
  }
}

export async function imprimerExportHaccp(titre: string, contenu: string, options: OptionsExportHaccp = {}) {
  await Print.printAsync({ html: documentHtml(titre, contenu, options) });
}

export async function exporterTemperaturesPdf(
  releves: ReleveTemperature[],
  options: OptionsExportHaccp = {}
) {
  const nombreConformes = releves.filter((releve) => releve.conforme).length;
  const nombreNonConformes = releves.length - nombreConformes;
  const taux = releves.length ? Math.round((nombreConformes / releves.length) * 100) : 0;
  const lignes = releves.length ? releves.map((releve) => `<tr>
    <td>${echapperHtml(releve.date)}</td><td>${echapperHtml(releve.heure)}</td><td>${echapperHtml(releve.periode)}</td>
    <td>${echapperHtml(releve.temperature)}</td><td>${echapperHtml(releve.responsable)}</td>
    <td class="${releve.conforme ? "ok" : "ko"}">${releve.conforme ? "Conforme" : "Non conforme"}</td>
  </tr>`).join("") : `<tr><td colspan="6">Aucun relevé enregistré.</td></tr>`;

  const contenu = `<h2>Relevés températures</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Période</th><th>Température</th><th>Responsable</th><th>Conformité</th></tr></thead><tbody>${lignes}</tbody></table>
    <div class="summary"><strong>Nombre de relevés :</strong> ${releves.length}<br /><strong>Nombre conformes :</strong> ${nombreConformes}<br /><strong>Nombre non conformes :</strong> ${nombreNonConformes}<br /><strong>Taux de conformité :</strong> ${taux}%</div>`;
  await genererEtPartagerPdf("Registre des températures", contenu, options);
}

export async function exporterTracabilitePdf(
  traces: TraceabiliteProduit[],
  options: OptionsExportHaccp = {}
) {
  const fiches = traces.map((trace) => {
    return `<div class="record"><h3>${echapperHtml(trace.produit)}</h3><table><tbody>
      <tr><th>Fournisseur</th><td>${echapperHtml(trace.fournisseur)}</td><th>Date réception</th><td>${echapperHtml(trace.dateReception)}</td></tr>
      <tr><th>DLC</th><td>${echapperHtml(trace.dlc)}</td><th>Température réception</th><td>${echapperHtml(trace.temperatureReception)}</td></tr>
      <tr><th>Lot</th><td>${echapperHtml(trace.lot)}</td><th>Commentaire</th><td>${echapperHtml(trace.commentaire)}</td></tr>
    </tbody></table></div>`;
  });
  const contenu = `<h2>Registre de traçabilité produits</h2>${fiches.length ? fiches.join("") : "<p>Aucune réception enregistrée.</p>"}`;
  await genererEtPartagerPdf("Registre de traçabilité produits", contenu, options);
}

export async function exporterActionsCorrectivesPdf(
  actions: ActionCorrective[],
  options: OptionsExportHaccp = {}
) {
  const fiches = await Promise.all(actions.map(async (action) => `<div class="record"><h3>${echapperHtml(action.date)} - ${echapperHtml(action.probleme)}</h3><table><tbody>
    <tr><th>Action réalisée</th><td>${echapperHtml(action.action)}</td></tr><tr><th>Responsable</th><td>${echapperHtml(action.responsable)}</td></tr>
    <tr><th>Commentaire</th><td>${echapperHtml(action.commentaire)}</td></tr><tr><th>Résolution</th><td>${echapperHtml(action.resolution)}</td></tr>
  </tbody></table>${photoHtml(await imageBase64(action.photoPreuve), "Photo de preuve d'anomalie")}</div>`));
  const contenu = `<h2>Actions correctives et anomalies</h2>${fiches.length ? fiches.join("") : "<p>Aucune action corrective enregistrée.</p>"}`;
  await genererEtPartagerPdf("Registre des actions correctives", contenu, options);
}

export async function exporterDossierHaccpCompletPdf(donnees: DonneesExportHaccp, options: OptionsExportHaccp = {}) {
  const nombreConformes = donnees.scoreHaccp.nombreConformes;
  const taux = donnees.scoreHaccp.nombreReleves ? Math.round((nombreConformes / donnees.scoreHaccp.nombreReleves) * 100) : 0;
  const temperatureLignes = donnees.releves.map((releve) => `<tr><td>${echapperHtml(releve.date)}</td><td>${echapperHtml(releve.heure)}</td><td>${echapperHtml(releve.periode)}</td><td>${echapperHtml(releve.temperature)}</td><td>${echapperHtml(releve.responsable)}</td><td class="${releve.conforme ? "ok" : "ko"}">${releve.conforme ? "Conforme" : "Non conforme"}</td></tr>`).join("") || `<tr><td colspan="6">Aucun relevé enregistré.</td></tr>`;
  const traceFiches = donnees.traces.map((trace) => `<div class="record"><h3>${echapperHtml(trace.produit)}</h3><p><strong>Fournisseur :</strong> ${echapperHtml(trace.fournisseur)}<br /><strong>Réception :</strong> ${echapperHtml(trace.dateReception)} · <strong>DLC :</strong> ${echapperHtml(trace.dlc)}<br /><strong>Température :</strong> ${echapperHtml(trace.temperatureReception)} · <strong>Lot :</strong> ${echapperHtml(trace.lot)}<br /><strong>Commentaire :</strong> ${echapperHtml(trace.commentaire)}</p></div>`);
  const actionFiches = await Promise.all(donnees.actions.map(async (action) => `<div class="record"><h3>${echapperHtml(action.date)} - ${echapperHtml(action.probleme)}</h3><p><strong>Action :</strong> ${echapperHtml(action.action)}<br /><strong>Responsable :</strong> ${echapperHtml(action.responsable)}<br /><strong>Commentaire :</strong> ${echapperHtml(action.commentaire)}<br /><strong>Résolution :</strong> ${echapperHtml(action.resolution)}</p>${photoHtml(await imageBase64(action.photoPreuve), "Photo de preuve d'anomalie")}</div>`));
  const contenu = `<h2>1 - Relevés températures</h2><table><thead><tr><th>Date</th><th>Heure</th><th>Période</th><th>Température</th><th>Responsable</th><th>Conformité</th></tr></thead><tbody>${temperatureLignes}</tbody></table>
    <h2>2 - Traçabilité produits</h2>${traceFiches.join("") || "<p>Aucune réception enregistrée.</p>"}
    <h2>3 - Actions correctives et anomalies</h2>${actionFiches.join("") || "<p>Aucune action corrective enregistrée.</p>"}
    <h2>4 - Score qualité HACCP</h2><div class="summary"><strong>Score total :</strong> ${donnees.scoreHaccp.totalPoints} points<br /><strong>Relevés :</strong> ${donnees.scoreHaccp.nombreReleves}<br /><strong>Preuves photos :</strong> ${donnees.scoreHaccp.nombrePhotos}</div>
    <h2>5 - Statistiques conformité</h2><div class="summary"><strong>Relevés conformes :</strong> ${nombreConformes}<br /><strong>Relevés non conformes :</strong> ${donnees.scoreHaccp.nombreReleves - nombreConformes}<br /><strong>Taux de conformité :</strong> ${taux}%</div>`;
  await genererEtPartagerPdf("Dossier HACCP complet", contenu, options);
}
