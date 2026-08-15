import type { JourPlanning, PeriodeTravail } from "@/types/planning";
import type { Pointage } from "@/types/pointage";
import type { TempsTravail } from "@/types/tempsTravail";

const PAUSE_AUTOMATIQUE_MINUTES = 30;

function heureEnMinutes(heure?: string): number | null {
  if (!heure) return null;
  const correspondance = /^(\d{1,2}):(\d{2})/.exec(heure);
  if (!correspondance) return null;
  const heures = Number(correspondance[1]);
  const minutes = Number(correspondance[2]);
  return heures <= 23 && minutes <= 59 ? heures * 60 + minutes : null;
}

function duree(debut?: string, fin?: string): number {
  const debutMinutes = heureEnMinutes(debut);
  const finInitiale = heureEnMinutes(fin);
  if (debutMinutes === null || finInitiale === null || debutMinutes === finInitiale) return 0;
  const finMinutes = finInitiale < debutMinutes ? finInitiale + 24 * 60 : finInitiale;
  return Math.max(0, finMinutes - debutMinutes);
}

function periodeComplete(periode: PeriodeTravail) {
  return Boolean(periode.heureDebut && periode.heureFin);
}

export function calculerTempsPrevu(jour: JourPlanning): number {
  return [jour.matin, jour.soir].reduce(
    (total, periode) => total + (periodeComplete(periode) ? Math.max(0, duree(periode.heureDebut, periode.heureFin) - PAUSE_AUTOMATIQUE_MINUTES) : 0),
    0,
  );
}

export function calculerTempsReel(pointages: Pointage[], nombrePeriodesPrevues = 1): number {
  const tries = [...pointages].sort((a, b) => a.heure.localeCompare(b.heure));
  const arrivee = tries.find((pointage) => pointage.type === "ARRIVEE")?.heure;
  const departService = [...tries].reverse().find((pointage) => pointage.type === "DEPART_SERVICE")?.heure;
  const departPause = tries.find((pointage) => pointage.type === "DEPART_PAUSE")?.heure;
  const reprisePause = tries.find((pointage) => pointage.type === "REPRISE_PAUSE")?.heure;
  const amplitude = duree(arrivee, departService);
  if (amplitude === 0) return 0;
  const pauseReelle = duree(departPause, reprisePause);
  const pauseADeduire = pauseReelle > 0
    ? pauseReelle
    : PAUSE_AUTOMATIQUE_MINUTES * Math.max(1, nombrePeriodesPrevues);
  return Math.max(0, amplitude - pauseADeduire);
}

export function calculerEcartHoraire(tempsPrevu: number, tempsReel: number): number {
  return tempsReel - tempsPrevu;
}

export function construireComparaisonTemps({ entrepriseId, utilisateurId, date, jour, pointages }: { entrepriseId: string; utilisateurId: string; date: string; jour: JourPlanning; pointages: Pointage[] }): TempsTravail {
  const periodes = [jour.matin, jour.soir].filter(periodeComplete);
  const tempsPrevu = calculerTempsPrevu(jour);
  const tempsReel = calculerTempsReel(pointages, periodes.length);
  const tries = [...pointages].sort((a, b) => a.heure.localeCompare(b.heure));
  return {
    id: `${entrepriseId}-${utilisateurId}-${date}`,
    entrepriseId,
    utilisateurId,
    date,
    planningPrevu: { debut: periodes[0]?.heureDebut ?? "", fin: periodes.at(-1)?.heureFin ?? "" },
    pointageReel: {
      arrivee: tries.find((pointage) => pointage.type === "ARRIVEE")?.heure,
      departPause: tries.find((pointage) => pointage.type === "DEPART_PAUSE")?.heure,
      reprisePause: tries.find((pointage) => pointage.type === "REPRISE_PAUSE")?.heure,
      departService: [...tries].reverse().find((pointage) => pointage.type === "DEPART_SERVICE")?.heure,
    },
    tempsPrevu,
    tempsReel,
    ecart: calculerEcartHoraire(tempsPrevu, tempsReel),
  };
}
