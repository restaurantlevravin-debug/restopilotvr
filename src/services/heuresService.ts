import { construireComparaisonTemps } from "@/services/calculTempsService";
import type { LignePlanningMensuel } from "@/types/planning";
import type { Pointage } from "@/types/pointage";
import type { LigneSyntheseHeures } from "@/types/validationHeures";

export function calculerHeuresSupplementaires(
  heuresPrevuesMinutes: number,
  heuresRealiseesMinutes: number
): number {
  return Math.max(0, heuresRealiseesMinutes - heuresPrevuesMinutes);
}

export function calculerSyntheseSalarie({
  entrepriseId,
  ligne,
  pointages,
  remarque,
}: {
  entrepriseId: string;
  ligne: LignePlanningMensuel;
  pointages: Pointage[];
  remarque?: string;
}): LigneSyntheseHeures {
  let heuresPrevuesMinutes = 0;
  let heuresRealiseesMinutes = 0;

  ligne.jours.forEach((jour) => {
    const pointagesJour = pointages.filter(
      (pointage) => pointage.utilisateurId === ligne.utilisateurId
        && pointage.date === jour.date
    );
    const comparaison = construireComparaisonTemps({
      entrepriseId,
      utilisateurId: ligne.utilisateurId,
      date: jour.date,
      jour,
      pointages: pointagesJour,
    });
    heuresPrevuesMinutes += comparaison.tempsPrevu;
    if (comparaison.pointageReel.departService) {
      heuresRealiseesMinutes += comparaison.tempsReel;
    }
  });

  const ecartMinutes = heuresRealiseesMinutes - heuresPrevuesMinutes;
  return {
    utilisateurId: ligne.utilisateurId,
    nom: ligne.nom,
    poste: ligne.poste,
    contratHebdomadaire: ligne.heuresContratHebdomadaires,
    heuresPrevuesMinutes,
    heuresRealiseesMinutes,
    ecartMinutes,
    heuresSupplementairesMinutes: calculerHeuresSupplementaires(
      heuresPrevuesMinutes,
      heuresRealiseesMinutes
    ),
    remarque,
  };
}

export function formaterHeuresPDF(minutes: number, avecSigne = false): string {
  const signe = avecSigne && minutes !== 0 ? (minutes > 0 ? "+" : "−") : "";
  const valeur = Math.abs(Math.round(minutes));
  return `${signe}${Math.floor(valeur / 60)}h${String(valeur % 60).padStart(2, "0")}`;
}
