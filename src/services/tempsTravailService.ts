import type { JourPlanning, PeriodeTravail } from "@/types/planning";
import type { Pointage } from "@/types/pointage";
import type { PresenceJournee, StatutPresence } from "@/types/presence";

function heureEnMinutes(heure?: string): number | null {
  if (!heure) return null;
  const correspondance = /^(\d{1,2}):(\d{2})/.exec(heure.trim());
  if (!correspondance) return null;
  const heures = Number(correspondance[1]);
  const minutes = Number(correspondance[2]);
  return heures <= 23 && minutes <= 59 ? heures * 60 + minutes : null;
}

function periodePlanifiee(periode: PeriodeTravail): boolean {
  return heureEnMinutes(periode.heureDebut) !== null
    && heureEnMinutes(periode.heureFin) !== null;
}

function formaterMinutes(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Retourne l'amplitude planifiée au format HH:mm - HH:mm. */
export function calculerHorairePrevu(jour?: JourPlanning): string {
  if (!jour) return "";
  const periodes = [jour.matin, jour.soir].filter(periodePlanifiee);
  const debut = heureEnMinutes(periodes[0]?.heureDebut);
  const fin = heureEnMinutes(periodes.at(-1)?.heureFin);
  if (debut === null || fin === null) return "";
  return `${formaterMinutes(debut)} - ${formaterMinutes(fin)}`;
}

export function calculerPresenceReelle(pointages: Pointage[]): {
  arrivee?: string;
  depart?: string;
  statut: StatutPresence;
} {
  const tries = [...pointages].sort((a, b) => a.heure.localeCompare(b.heure));
  const arrivee = tries.find((pointage) => pointage.type === "ARRIVEE")?.heure;
  const depart = [...tries]
    .reverse()
    .find((pointage) => pointage.type === "DEPART_SERVICE")?.heure;

  return {
    arrivee,
    depart,
    statut: depart ? "TERMINE" : arrivee ? "EN_SERVICE" : "NON_ARRIVE",
  };
}

/** Positif quand le salarié arrive en retard, négatif quand il arrive en avance. */
export function calculerEcartHoraire(horairePrevu: string, arrivee?: string): number {
  const prevu = heureEnMinutes(horairePrevu);
  const reel = heureEnMinutes(arrivee);
  if (prevu === null || reel === null) return 0;

  let ecart = reel - prevu;
  if (ecart > 12 * 60) ecart -= 24 * 60;
  if (ecart < -12 * 60) ecart += 24 * 60;
  return ecart;
}

export function construirePresenceJournee({
  entrepriseId,
  utilisateurId,
  date,
  jour,
  pointages,
}: {
  entrepriseId: string;
  utilisateurId: string;
  date: string;
  jour?: JourPlanning;
  pointages: Pointage[];
}): PresenceJournee {
  const horairePrevu = calculerHorairePrevu(jour);
  const presence = calculerPresenceReelle(pointages);
  return {
    id: `${entrepriseId}-${utilisateurId}-${date}`,
    entrepriseId,
    utilisateurId,
    date,
    horairePrevu,
    ...presence,
    ecartMinutes: calculerEcartHoraire(horairePrevu, presence.arrivee),
  };
}
