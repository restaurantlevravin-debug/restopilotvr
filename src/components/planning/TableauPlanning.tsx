import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";

import type { CalculHeuresPlanning, JourPlanning, LignePlanningMensuel, PlanningMensuel } from "@/types/planning";

type TableauPlanningProps = {
  planning: PlanningMensuel;
  calculerHeures: (ligne: LignePlanningMensuel, baseContrat?: "MENSUELLE" | "HEBDOMADAIRE") => CalculHeuresPlanning;
  onModifierJour: (ligne: LignePlanningMensuel, jour: JourPlanning) => void;
  lectureSeule?: boolean;
};

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const ABREVIATIONS: Record<string, string> = {
  "Congé payé": "CP", "Arrêt travail": "Arrêt", "Récupération": "Récup.",
  "Heure supplémentaire": "HS", "Repos": "Repos", "Absence exceptionnelle": "Abs.", "Autre": "Autre",
};

function lundiDe(dateIso: string) {
  const date = new Date(`${dateIso}T12:00:00`);
  const decalage = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - decalage);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function grouperSemaines(planning: PlanningMensuel) {
  const dates = planning.lignes[0]?.jours.map((jour) => jour.date) ?? [];
  return [...new Set(dates.map(lundiDe))].sort();
}

function dateAvecDecalage(dateIso: string, jours: number) {
  const date = new Date(`${dateIso}T12:00:00`);
  date.setDate(date.getDate() + jours);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function contenuJour(jour?: JourPlanning) {
  if (!jour) return <Text style={styles.horsMois}>—</Text>;
  if (jour.remarque && !jour.matin.heureDebut && !jour.soir.heureDebut) {
    return <Text style={styles.absence}>{ABREVIATIONS[jour.remarque] ?? jour.remarque}</Text>;
  }
  return <>
    <Text style={styles.horaire}>M : {jour.matin.heureDebut ? `${jour.matin.heureDebut}-${jour.matin.heureFin}` : "—"}</Text>
    <Text style={styles.horaire}>S : {jour.soir.heureDebut ? `${jour.soir.heureDebut}-${jour.soir.heureFin}` : "—"}</Text>
    {jour.remarque ? <Text numberOfLines={1} style={styles.remarqueCellule}>{ABREVIATIONS[jour.remarque] ?? jour.remarque}</Text> : null}
  </>;
}

export function TableauPlanning({ planning, calculerHeures, onModifierJour, lectureSeule = false }: TableauPlanningProps) {
  const semaines = grouperSemaines(planning);
  return <View style={styles.conteneur}>{semaines.map((lundi, index) => {
    const dates = JOURS.map((_, jourIndex) => dateAvecDecalage(lundi, jourIndex));
    const dimanche = dates[6];
    return <View key={lundi} style={styles.semaine}>
      <Text style={styles.semaineTitre}>Semaine {index + 1} · {lundi.slice(8, 10)}/{lundi.slice(5, 7)} au {dimanche.slice(8, 10)}/{dimanche.slice(5, 7)}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.entete}>
            <Text style={[styles.fixe, styles.enteteTexte]}>Salarié</Text><Text style={[styles.poste, styles.enteteTexte]}>Poste</Text><Text style={[styles.contrat, styles.enteteTexte]}>Contrat</Text>
            {JOURS.map((jour) => <Text key={jour} style={[styles.jour, styles.enteteTexte]}>{jour}</Text>)}
            <Text style={[styles.total, styles.enteteTexte]}>Total</Text><Text style={[styles.remarques, styles.enteteTexte]}>Remarques</Text>
          </View>
          {planning.lignes.map((ligne) => {
            const joursSemaine = dates.map((date) => ligne.jours.find((jour) => jour.date === date));
            const calcul = calculerHeures({ ...ligne, jours: joursSemaine.filter((jour): jour is JourPlanning => Boolean(jour)) }, "HEBDOMADAIRE");
            const remarques = joursSemaine.filter((jour) => jour?.remarque).map((jour) => `${jour!.date.slice(-2)}: ${jour!.remarque}${jour!.remarqueLibre ? ` (${jour!.remarqueLibre})` : ""}`).join(" · ");
            return <View key={`${ligne.utilisateurId}-${lundi}`} style={styles.ligne}>
              <View style={styles.fixe}><Text style={styles.nom}>{ligne.nom}</Text></View><View style={styles.poste}><Text style={styles.texte}>{ligne.poste || "—"}</Text></View><View style={styles.contrat}><Text style={styles.contratValeur}>{ligne.heuresContratHebdomadaires} h</Text></View>
              {joursSemaine.map((jour, jourIndex) => <Pressable key={dates[jourIndex]} disabled={!jour || lectureSeule || planning.statut === "VALIDE"} style={[styles.jour, !jour && styles.celluleHorsMois]} onPress={() => jour && onModifierJour(ligne, jour)}>{contenuJour(jour)}</Pressable>)}
              <View style={styles.total}><Text style={styles.totalNet}>{calcul.heuresCalculees} h</Text><Text style={styles.totalDetail}>Prévu {calcul.heuresPrevues} h</Text><Text style={calcul.ecartContrat >= 0 ? styles.ecartPositif : styles.ecartNegatif}>{calcul.ecartContrat >= 0 ? "+" : ""}{calcul.ecartContrat} h</Text></View>
              <View style={styles.remarques}><Text style={styles.remarqueTexte}>{remarques || "—"}</Text></View>
            </View>;
          })}
        </View>
      </ScrollView>
    </View>;
  })}</View>;
}

const styles = StyleSheet.create({
  conteneur: { gap: 18 }, semaine: { backgroundColor: "#12110e", borderWidth: 1, borderColor: "#58451f", borderRadius: 12, overflow: "hidden" }, semaineTitre: { color: "#eed184", fontSize: 15, fontWeight: "900", backgroundColor: "#211b10", padding: 11 }, entete: { flexDirection: "row", backgroundColor: "#2a2214" }, ligne: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#4b402b" }, enteteTexte: { color: "#e2c472", fontSize: 11, fontWeight: "900", textAlign: "center", textAlignVertical: "center" }, fixe: { width: 135, minHeight: 76, padding: 7, justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#51452f" }, poste: { width: 115, minHeight: 76, padding: 7, justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#51452f" }, contrat: { width: 72, minHeight: 76, padding: 7, justifyContent: "center", alignItems: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#51452f" }, jour: { width: 112, minHeight: 76, padding: 6, justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#51452f" }, total: { width: 100, minHeight: 76, padding: 6, justifyContent: "center", alignItems: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#51452f" }, remarques: { width: 180, minHeight: 76, padding: 7, justifyContent: "center" }, nom: { color: "#f1e4c5", fontWeight: "900" }, texte: { color: "#c4b89f", fontSize: 12 }, contratValeur: { color: "#e5ca79", fontWeight: "800" }, horaire: { color: "#e8dcc0", fontSize: 10, lineHeight: 15 }, absence: { color: "#efa85d", fontSize: 13, fontWeight: "900", textAlign: "center" }, remarqueCellule: { color: "#dbad51", fontSize: 9, marginTop: 3 }, celluleHorsMois: { backgroundColor: "#0d0d0c" }, horsMois: { color: "#48443c", textAlign: "center" }, totalNet: { color: "#f1d375", fontWeight: "900" }, totalDetail: { color: "#9e947f", fontSize: 9 }, ecartPositif: { color: "#77c98b", fontSize: 11, fontWeight: "800" }, ecartNegatif: { color: "#e37f72", fontSize: 11, fontWeight: "800" }, remarqueTexte: { color: "#b9ad95", fontSize: 10, lineHeight: 14 },
});
