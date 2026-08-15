import type { AnomalieHaccp } from "@/types/anomalieHaccp";
import type { ControleRealise, PointControleHaccp } from "@/types/controleHaccp";
import type { Entreprise } from "@/types/entreprise";
import type { LigneHistoriqueHaccp, RapportHaccp, SyntheseEntrepriseHaccp } from "@/types/rapportHaccp";
import type { ValidationAction } from "@/types/validation";

type SourcesRapport = {
  entreprise: Entreprise;
  periode: { debut: string; fin: string };
  controles: ControleRealise[];
  pointsControle: PointControleHaccp[];
  anomalies: AnomalieHaccp[];
  validations: ValidationAction[];
  niveauEquipe?: string;
};

function normaliserDate(valeur: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(valeur)) return valeur.slice(0, 10);
  const morceaux = valeur.split("/");
  return morceaux.length === 3 ? `${morceaux[2]}-${morceaux[1].padStart(2, "0")}-${morceaux[0].padStart(2, "0")}` : valeur;
}

function dansPeriode(date: string, periode: { debut: string; fin: string }) {
  const dateNormalisee = normaliserDate(date);
  return dateNormalisee >= periode.debut && dateNormalisee <= periode.fin;
}

export function calculerTauxConformite(nombreConformes: number, nombreTotal: number): number {
  return nombreTotal === 0 ? 0 : Math.round((nombreConformes / nombreTotal) * 1000) / 10;
}

export function genererRapportHaccp(sources: SourcesRapport): RapportHaccp {
  const controles = sources.controles.filter((c) => c.entrepriseId === sources.entreprise.id && dansPeriode(c.date, sources.periode));
  const anomalies = sources.anomalies.filter((a) => a.entrepriseId === sources.entreprise.id && dansPeriode(a.dateCreation, sources.periode));
  const validations = sources.validations.filter((v) => v.entrepriseId === sources.entreprise.id && dansPeriode(v.dateValidation, sources.periode));
  const controlesConformes = controles.filter((c) => c.conforme).length;

  const pointsControle = sources.pointsControle
    .filter((p) => p.entrepriseId === sources.entreprise.id)
    .map((point) => {
      const passages = controles.filter((c) => c.pointControleId === point.id);
      return {
        nom: point.nom,
        nombrePassages: passages.length,
        conformite: calculerTauxConformite(passages.filter((c) => c.conforme).length, passages.length),
      };
    })
    .filter((point) => point.nombrePassages > 0);

  const compteValidations = new Map<string, RapportHaccp["validations"][number]>();
  validations.forEach((validation) => {
    const cle = `${validation.valideParUtilisateurId}-${validation.valideParRole}`;
    const existant = compteValidations.get(cle);
    compteValidations.set(cle, {
      utilisateurId: validation.valideParUtilisateurId,
      role: validation.valideParRole,
      nombreValidations: (existant?.nombreValidations ?? 0) + 1,
    });
  });

  return {
    id: `rapport-${sources.entreprise.id}-${sources.periode.debut}-${sources.periode.fin}`,
    entrepriseId: sources.entreprise.id,
    periode: sources.periode,
    statistiques: {
      nombreControles: controles.length,
      controlesConformes,
      tauxConformite: calculerTauxConformite(controlesConformes, controles.length),
      nombreAnomalies: anomalies.length,
      anomaliesResolues: anomalies.filter((a) => a.statut === "CLOTUREE").length,
      anomaliesOuvertes: anomalies.filter((a) => a.statut !== "CLOTUREE").length,
      actionsCorrectives: anomalies.filter((a) => Boolean(a.actionCorrective)).length,
    },
    pointsControle,
    validations: [...compteValidations.values()],
    generationDate: new Date().toISOString(),
  };
}

export function obtenirSyntheseEntreprise(sources: SourcesRapport): SyntheseEntrepriseHaccp {
  const rapport = genererRapportHaccp(sources);
  const anomaliesPeriode = sources.anomalies.filter((a) => a.entrepriseId === sources.entreprise.id && dansPeriode(a.dateCreation, sources.periode));
  const resolues = anomaliesPeriode.filter((a) => a.dateCloture);
  const moyenneMs = resolues.length === 0 ? 0 : resolues.reduce((total, anomalie) => {
    const debut = new Date(`${anomalie.dateCreation}T${anomalie.heureCreation}`).getTime();
    return total + Math.max(0, new Date(anomalie.dateCloture!).getTime() - debut);
  }, 0) / resolues.length;
  return {
    nombreControles: rapport.statistiques.nombreControles,
    tauxConformite: rapport.statistiques.tauxConformite,
    anomaliesTraitees: rapport.statistiques.anomaliesResolues,
    anomaliesOuvertes: rapport.statistiques.anomaliesOuvertes,
    tempsMoyenResolutionJours: Math.round((moyenneMs / 86_400_000) * 10) / 10,
    niveauEquipe: sources.niveauEquipe ?? "Progression en cours",
  };
}

export function obtenirHistoriqueRapport(sources: SourcesRapport): LigneHistoriqueHaccp[] {
  return sources.controles
    .filter((c) => c.entrepriseId === sources.entreprise.id && dansPeriode(c.date, sources.periode))
    .map((controle) => {
      const anomalie = sources.anomalies.find((a) => a.controleId === controle.id);
      const validationAnomalie = anomalie
        ? sources.validations.find((v) => v.actionType === "HACCP_ANOMALIE" && v.actionId === anomalie.id)
        : undefined;
      return {
        id: controle.id,
        date: normaliserDate(controle.date),
        heure: controle.heure,
        controle: sources.pointsControle.find((p) => p.id === controle.pointControleId)?.nom ?? "Point supprimé ou archivé",
        resultat: controle.valeur ?? "Non renseigné",
        utilisateurId: controle.utilisateurId,
        validation: controle.validation?.valideParNom ?? validationAnomalie?.valideParNom ?? (controle.statutValidation === "EN_ATTENTE" ? "En attente" : "Non requise"),
        conforme: controle.conforme,
      };
    })
    .sort((a, b) => `${b.date}T${b.heure}`.localeCompare(`${a.date}T${a.heure}`));
}

export async function exporterRapportPDF(_rapport: RapportHaccp): Promise<{ disponible: false }> {
  return { disponible: false };
}
