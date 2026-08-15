import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { ReleveTemperature, PointControleTemperature } from "@/context/HaccpContext";
import { useEntreprise } from "@/context/EntrepriseContext";

export type RapportHaccpOptions = {
  nomRestaurant?: string;
  periode?: string;
  responsableEtablissement?: string;
  signatureResponsable?: string;
  destinataireEmail?: string;
  archivageMensuel?: boolean;
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

function garantirValeur(valeur: string | number | undefined, defaut = "N/A") {
  return valeur === undefined || valeur === null || String(valeur).trim() === ""
    ? defaut
    : String(valeur);
}

function construireDocumentHtml(
  entrepriseNom: string,
  periode: string,
  responsableEtablissement: string,
  contenu: string,
  titre = "RAPPORT HACCP"
) {
  const dateGeneration = new Date().toLocaleString("fr-FR");

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <style>
        @page { margin: 18mm 14mm; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2933;
          font-size: 11px;
          line-height: 1.5;
          margin: 0;
        }
        .page {
          padding: 0;
        }
        .header {
          border-bottom: 3px solid #00695C;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .logo-box {
          background: linear-gradient(135deg, #00695C 0%, #0f8a7b 100%);
          color: #ffffff;
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          margin-right: 14px;
          box-shadow: 0 6px 18px rgba(0, 105, 92, 0.18);
        }
        .brand {
          display: flex;
          align-items: center;
        }
        .brand-name {
          font-size: 19px;
          font-weight: 800;
          color: #00695C;
          letter-spacing: 0.2px;
        }
        .meta {
          text-align: right;
          color: #52606d;
          font-size: 10px;
          line-height: 1.7;
        }
        .cover {
          background: linear-gradient(135deg, #f6f9f8 0%, #eef6f4 100%);
          border: 1px solid #dfe9e5;
          border-radius: 16px;
          padding: 26px 20px;
          margin: 10px 0 24px;
          text-align: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.03);
        }
        .cover-badge {
          display: inline-block;
          background: #00695C;
          color: #fff;
          border-radius: 999px;
          padding: 6px 12px;
          font-size: 9px;
          letter-spacing: 1.1px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 12px;
        }
        .cover-title {
          font-size: 32px;
          font-weight: 800;
          color: #00695C;
          letter-spacing: 0.7px;
          margin-bottom: 10px;
        }
        .cover-sub {
          font-size: 15px;
          color: #243238;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .cover-meta-row {
          display: inline-block;
          font-size: 11px;
          color: #52606d;
          background: rgba(255,255,255,0.7);
          border: 1px solid #dfe9e5;
          border-radius: 999px;
          padding: 7px 12px;
          margin-top: 8px;
        }
        h1 {
          font-size: 28px;
          margin: 0 0 12px;
          color: #00695C;
        }
        h2 {
          color: #00695C;
          background: linear-gradient(90deg, #eaf5f3 0%, #f5f8f7 100%);
          border-left: 4px solid #B08D57;
          padding: 8px 10px;
          margin: 20px 0 10px;
          font-size: 15px;
          letter-spacing: 0.2px;
        }
        .section-box {
          margin-bottom: 14px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(170px, 1fr));
          gap: 10px;
          margin: 12px 0 16px;
        }
        .stat {
          background: linear-gradient(135deg, #ffffff 0%, #f4f7f6 100%);
          border: 1px solid #dfe9e5;
          border-left: 4px solid #00695C;
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: 0 3px 12px rgba(0, 0, 0, 0.02);
        }
        .stat-label {
          font-size: 10px;
          color: #52606d;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .stat-value {
          font-size: 22px;
          font-weight: 800;
          color: #00695C;
          margin-top: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          page-break-inside: avoid;
        }
        th, td {
          border: 1px solid #dfe6ea;
          padding: 6px 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background: linear-gradient(180deg, #00695C 0%, #0d7d6e 100%);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
        }
        td {
          font-size: 10px;
          background: #ffffff;
        }
        .ok {
          color: #1b7f5c;
          font-weight: 800;
        }
        .ko {
          color: #b3261e;
          font-weight: 800;
        }
        .muted {
          color: #52606d;
        }
        .photo {
          margin-top: 8px;
          border: 1px solid #dfe6ea;
          background: #f8f9fa;
          padding: 8px;
          border-radius: 8px;
          page-break-inside: avoid;
        }
        .photo strong {
          color: #00695C;
        }
        .photo img {
          max-width: 100%;
          max-height: 220px;
          display: block;
          margin-top: 6px;
          border-radius: 6px;
          border: 1px solid #dfe6ea;
        }
        .signature-box {
          background: linear-gradient(135deg, #fbfbfb 0%, #f4f7f6 100%);
          border: 1px solid #dfe9e5;
          border-radius: 10px;
          padding: 12px;
          margin-top: 12px;
        }
        .footer {
          margin-top: 24px;
          border-top: 1px solid #dfe6ea;
          padding-top: 12px;
          font-size: 9px;
          color: #52606d;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="brand">
            <div class="logo-box">RP</div>
            <div>
              <div class="brand-name">${echapperHtml(entrepriseNom)}</div>
              <div class="muted">${echapperHtml(responsableEtablissement)}</div>
            </div>
          </div>
          <div class="meta">
            <div><strong>Période :</strong> ${echapperHtml(periode)}</div>
            <div><strong>Généré le :</strong> ${echapperHtml(dateGeneration)}</div>
          </div>
        </div>

        <div class="cover">
          <div class="cover-badge">RestoPilot</div>
          <div class="cover-title">${echapperHtml(titre)}</div>
          <div class="cover-sub">${echapperHtml(entrepriseNom)}</div>
          <div class="cover-meta-row">Période : ${echapperHtml(periode)} · Responsable : ${echapperHtml(responsableEtablissement)}</div>
        </div>

        ${contenu}

        <div class="footer">
          Document généré par RestoPilotVR – à conserver dans le registre HACCP
        </div>
      </div>
    </body>
  </html>`;
}

async function genererPdfEtPartager(
  titre: string,
  contenu: string,
  options: RapportHaccpOptions = {},
  entrepriseNom?: string,
  responsableEtablissement?: string,
  periode?: string
) {
  const html = construireDocumentHtml(
    entrepriseNom ?? options.nomRestaurant ?? "Entreprise",
    periode ?? options.periode ?? "Période non définie",
    responsableEtablissement ?? options.responsableEtablissement ?? "Responsable non renseigné",
    contenu,
    titre
  );

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS !== "web" && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(uri, {
      UTI: ".pdf",
      mimeType: "application/pdf",
      dialogTitle: titre,
    });
  }

  return uri;
}

export async function genererRapportHaccpPdf({
  releves,
  pointsControle,
  entrepriseNom,
  periode,
  responsableEtablissement,
}: {
  releves: ReleveTemperature[];
  pointsControle: PointControleTemperature[];
  entrepriseNom?: string;
  periode?: string;
  responsableEtablissement?: string;
}) {
  const controlesTotal = releves.length;
  const conformes = releves.filter((releve) => releve.conforme).length;
  const anomalies = releves.filter((releve) => !releve.conforme).length;
  const photosAnomalies = releves.filter((releve) => !releve.conforme && Boolean(releve.photo)).length;
  const taux = controlesTotal === 0 ? 0 : Math.round((conformes / controlesTotal) * 1000) / 10;

  const lignesTableau = releves.length
    ? releves
        .slice()
        .sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return dateB.localeCompare(dateA);
        })
        .map((releve) => {
          const point = pointsControle.find((p) => p.id === releve.pointControleId);
          const valeurMin = point?.temperatureMin ?? "N/A";
          const valeurMax = point?.temperatureMax ?? "N/A";

          return `<tr>
            <td>${echapperHtml(releve.date)}</td>
            <td>${echapperHtml(releve.heure)}</td>
            <td>${echapperHtml(point?.nom ?? "Point inconnu")}</td>
            <td>${echapperHtml(releve.temperature)}°C</td>
            <td>${echapperHtml(valeurMin)}°C → ${echapperHtml(valeurMax)}°C</td>
            <td class="${releve.conforme ? "ok" : "ko"}">${releve.conforme ? "✅ Conforme" : "❌ Anomalie"}</td>
            <td>${echapperHtml(releve.effectuePar?.nom ?? "Inconnu")}</td>
            <td>${echapperHtml(releve.effectuePar?.role ?? "-")}</td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8">Aucun contrôle enregistré pour cette période.</td></tr>`;

  const anomaliesHtml = releves.filter((releve) => !releve.conforme).length
    ? releves
        .filter((releve) => !releve.conforme)
        .map((releve) => {
          const point = pointsControle.find((p) => p.id === releve.pointControleId);
          const photo = releve.photo
            ? `<div class="photo"><strong>Photo :</strong><img src="${echapperHtml(releve.photo)}" alt="Preuve anomalie" /></div>`
            : "";

          return `<div class="section-box">
            <table>
              <tr><th>Date</th><td>${echapperHtml(releve.date)}</td><th>Point</th><td>${echapperHtml(point?.nom ?? "Point inconnu")}</td></tr>
              <tr><th>Température</th><td>${echapperHtml(releve.temperature)}°C</td><th>Motif</th><td>${echapperHtml(releve.commentaireAnomalie ?? "Non renseigné")}</td></tr>
              <tr><th>Action corrective</th><td colspan="3">${echapperHtml(releve.actionCorrective ?? "Non renseignée")}</td></tr>
              <tr><th>Traité par</th><td>${echapperHtml(releve.effectuePar?.nom ?? "Inconnu")}</td><th>Rôle</th><td>${echapperHtml(releve.effectuePar?.role ?? "-")}</td></tr>
            </table>
            ${photo}
          </div>`;
        })
        .join("")
    : "<p class=\"muted\">Aucune anomalie détectée sur la période sélectionnée.</p>";

  const validationsHtml = releves.filter((releve) => releve.validePar).length
    ? `<table><thead><tr><th>Nom</th><th>Rôle</th><th>Date validation</th></tr></thead><tbody>${releves
        .filter((releve) => releve.validePar)
        .map(
          (releve) => `<tr><td>${echapperHtml(releve.validePar?.nom ?? "-")}</td><td>${echapperHtml(releve.validePar?.role ?? "-")}</td><td>${echapperHtml(releve.dateValidation ?? "-")}</td></tr>`
        )
        .join("")}</tbody></table>`
    : "<p class=\"muted\">Aucune validation enregistrée.</p>";

  const signataire = releves.find((releve) => releve.signePar)?.signePar;
  const signatureHtml = signataire
    ? `<table><tr><th>Nom du signataire</th><td>${echapperHtml(signataire.nom)}</td><th>Rôle</th><td>${echapperHtml(signataire.role)}</td><th>Date</th><td>${echapperHtml(signataire.date)}</td></tr></table>`
    : "<p class=\"muted\">Aucune signature finale enregistrée.</p>";

  const contenu = `
    <div class="section-box">
      <h2>1 - Synthèse</h2>
      <div class="summary-grid">
        <div class="stat"><div class="stat-label">Contrôles réalisés</div><div class="stat-value">${conformes + anomalies}</div></div>
        <div class="stat"><div class="stat-label">Conformes</div><div class="stat-value">${conformes}</div></div>
        <div class="stat"><div class="stat-label">Anomalies</div><div class="stat-value">${anomalies}</div></div>
        <div class="stat"><div class="stat-label">Taux de conformité</div><div class="stat-value">${taux}%</div></div>
        <div class="stat"><div class="stat-label">Photos d'anomalies</div><div class="stat-value">${photosAnomalies}</div></div>
      </div>
    </div>

    <div class="section-box">
      <h2>2 - Contrôles température</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Heure</th>
            <th>Point de contrôle</th>
            <th>Température</th>
            <th>Valeur attendue</th>
            <th>Statut</th>
            <th>Utilisateur</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>${lignesTableau}</tbody>
      </table>
    </div>

    <div class="section-box">
      <h2>3 - Anomalies</h2>
      ${anomaliesHtml}
    </div>

    <div class="section-box">
      <h2>4 - Validation</h2>
      ${validationsHtml}
    </div>

    <div class="section-box">
      <h2>5 - Signature finale</h2>
      <div class="signature-box">
        ${signatureHtml}
      </div>
    </div>
  `;

  const uri = await genererPdfEtPartager(
    "RAPPORT HACCP",
    contenu,
    {
      nomRestaurant: entrepriseNom ?? "Entreprise",
      periode: periode ?? "Historique complet",
      responsableEtablissement: responsableEtablissement ?? "Responsable non renseigné",
    },
    entrepriseNom ?? "Entreprise",
    responsableEtablissement ?? "Responsable non renseigné",
    periode ?? "Historique complet"
  );

  return uri;
}
