import { Redirect } from "expo-router";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { PointagePadProvider, usePointagePad } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";
import { construirePresenceJournee } from "@/services/tempsTravailService";
import type { PresenceJournee } from "@/types/presence";

function dateLocale(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function afficherHeure(heure?: string): string {
  return heure ? heure.replace(/(\d{1,2}):(\d{2})(?::\d{2})?/g, "$1h$2") : "—";
}

function indicateur(presence: PresenceJournee) {
  if (!presence.arrivee || !presence.horairePrevu) return { emoji: "", texte: "—", couleur: "#9b917c" };
  if (presence.ecartMinutes > 0) return { emoji: "🟠", texte: "Retard", couleur: "#e6a84c" };
  if (presence.ecartMinutes < 0) return { emoji: "🔵", texte: "En avance", couleur: "#71b7e6" };
  return { emoji: "🟢", texte: "À l’heure", couleur: "#71cf91" };
}

function afficherEcart(presence: PresenceJournee): string {
  if (!presence.arrivee || !presence.horairePrevu) return "—";
  if (presence.ecartMinutes === 0) return "0 min";
  return `${presence.ecartMinutes > 0 ? "+" : "−"}${Math.abs(presence.ecartMinutes)} min`;
}

export default function PresenceJourScreen() {
  const { utilisateurActif } = useUser();
  if (utilisateurActif?.role !== "GERANT") return <Redirect href="/" />;
  return <PointagePadProvider mode="GESTION_GERANT"><PresenceEquipe /></PointagePadProvider>;
}

function PresenceEquipe() {
  const aujourdHui = dateLocale(new Date());
  const { entrepriseActive } = useEntreprise();
  const { utilisateurs } = useUser();
  const { obtenirPlanningEntreprise } = usePlanning();
  const { obtenirPointagesGerant } = usePointagePad();
  const planning = obtenirPlanningEntreprise(new Date().getMonth() + 1, new Date().getFullYear());
  const pointages = obtenirPointagesGerant(aujourdHui);
  const equipe = utilisateurs.filter((utilisateur) => {
    const ligne = planning?.lignes.find((element) => element.utilisateurId === utilisateur.id);
    const jour = ligne?.jours.find((element) => element.date === aujourdHui);
    const estPlanifie = Boolean(jour?.matin.heureDebut || jour?.soir.heureDebut);
    const aPointe = pointages.some((pointage) => pointage.utilisateurId === utilisateur.id);
    return utilisateur.entrepriseId === entrepriseActive?.id
      && utilisateur.actif
      && utilisateur.role !== "GERANT"
      && (estPlanifie || aPointe);
  });
  const presences = equipe.map((utilisateur) => {
    const ligne = planning?.lignes.find((element) => element.utilisateurId === utilisateur.id);
    return {
      utilisateur,
      presence: construirePresenceJournee({
        entrepriseId: entrepriseActive?.id ?? "",
        utilisateurId: utilisateur.id,
        date: aujourdHui,
        jour: ligne?.jours.find((jour) => jour.date === aujourdHui),
        pointages: pointages.filter((pointage) => pointage.utilisateurId === utilisateur.id),
      }),
    };
  });

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}><Text style={styles.surtitre}>PAD CENTRAL · TEMPS RÉEL</Text><Text style={styles.titre}>Présence équipe aujourd’hui</Text><Text style={styles.date}>{new Date(`${aujourdHui}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.table}><View style={[styles.ligne, styles.entete]}><Cell texte="Salarié" style={styles.salarie} entete /><Cell texte="Poste" style={styles.poste} entete /><Cell texte="Prévu" style={styles.prevu} entete /><Cell texte="Arrivée" entete /><Cell texte="Départ" entete /><Cell texte="Statut" style={styles.statut} entete /><Cell texte="Écart" style={styles.ecart} entete /></View>{presences.map(({ utilisateur, presence }) => { const etat = indicateur(presence); return <View key={presence.id} style={styles.ligne}><Cell texte={utilisateur.nom} style={styles.salarie} fort /><Cell texte={utilisateur.poste || "Équipe"} style={styles.poste} /><Cell texte={afficherHeure(presence.horairePrevu)} style={styles.prevu} /><Cell texte={afficherHeure(presence.arrivee)} fort /><Cell texte={afficherHeure(presence.depart)} fort /><Cell texte={presence.statut === "NON_ARRIVE" ? "⚪ NON ARRIVÉ" : presence.statut === "EN_SERVICE" ? "🟢 EN SERVICE" : "⚪ TERMINÉ"} style={styles.statut} /><View style={[styles.cellule, styles.ecart]}><Text style={[styles.ecartTexte, { color: etat.couleur }]}>{etat.emoji} {etat.texte}</Text><Text style={styles.minutes}>{afficherEcart(presence)}</Text></View></View>; })}{presences.length === 0 ? <Text style={styles.vide}>Aucun salarié planifié ou pointé aujourd’hui.</Text> : null}</View></ScrollView><View style={styles.legende}><Text style={styles.legendeTexte}>🟢 À l’heure</Text><Text style={styles.legendeTexte}>🟠 Retard</Text><Text style={styles.legendeTexte}>🔵 En avance</Text><Text style={styles.legendeTexte}>⚪ Non arrivé</Text></View><Text style={styles.note}>Le planning reste la prévision. Les pointages du PAD représentent le réel.</Text></ScrollView></SafeAreaView>;
}

function Cell({ texte, style, entete, fort }: { texte: string; style?: object; entete?: boolean; fort?: boolean }) {
  return <View style={[styles.cellule, style]}><Text style={[styles.texte, entete && styles.texteEntete, fort && styles.texteFort]}>{texte}</Text></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#080706" }, contenu: { padding: 20, paddingBottom: 50, alignItems: "center" }, surtitre: { color: "#96712a", fontSize: 10, letterSpacing: 3, textAlign: "center" }, titre: { color: "#f1d37b", fontSize: 30, fontWeight: "900", marginTop: 8, textAlign: "center" }, date: { color: "#a99d84", fontSize: 15, marginBottom: 22, marginTop: 6, textTransform: "capitalize" }, table: { minWidth: 1080, backgroundColor: "#15120d", borderColor: "#554321", borderRadius: 15, borderWidth: 1, overflow: "hidden" }, ligne: { minHeight: 72, flexDirection: "row", alignItems: "stretch", borderTopColor: "#3d321f", borderTopWidth: StyleSheet.hairlineWidth }, entete: { minHeight: 48, backgroundColor: "#292010", borderTopWidth: 0 }, cellule: { width: 105, paddingHorizontal: 8, justifyContent: "center" }, salarie: { width: 170 }, poste: { width: 145 }, prevu: { width: 175 }, statut: { width: 145 }, ecart: { width: 150 }, texte: { color: "#c7bda7", fontSize: 13, textAlign: "center" }, texteEntete: { color: "#e5cb77", fontSize: 11, fontWeight: "900", letterSpacing: 0.6, textTransform: "uppercase" }, texteFort: { color: "#f3e5c6", fontWeight: "900" }, ecartTexte: { fontSize: 13, fontWeight: "900", textAlign: "center" }, minutes: { color: "#918671", fontSize: 11, marginTop: 3, textAlign: "center" }, vide: { color: "#9b917c", padding: 24, textAlign: "center" }, legende: { flexDirection: "row", flexWrap: "wrap", gap: 18, justifyContent: "center", marginTop: 20 }, legendeTexte: { color: "#d8cdb5", fontWeight: "800" }, note: { color: "#817765", fontSize: 12, marginTop: 18, textAlign: "center" } });
