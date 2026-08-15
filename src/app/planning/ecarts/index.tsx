import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePlanning } from "@/context/PlanningContext";
import { PointagePadProvider, usePointagePad } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";

function dateIso(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function duree(minutes: number) { const signe = minutes < 0 ? "-" : ""; const valeur = Math.abs(minutes); return `${signe}${Math.floor(valeur / 60)}h${String(valeur % 60).padStart(2, "0")}`; }
function ecart(minutes: number) { return `${minutes >= 0 ? "+" : "-"}${Math.abs(minutes)} min`; }
function indicateur(minutes: number) { const valeur = Math.abs(minutes); return valeur <= 10 ? { emoji: "🟢", texte: "Dans le planning" } : valeur <= 30 ? { emoji: "🟠", texte: "Petit écart" } : { emoji: "🔴", texte: "Écart important" }; }

export default function EcartsPlanningScreen() {
  const { utilisateurActif } = useUser();
  if (utilisateurActif?.role !== "GERANT") return <Redirect href="/" />;
  return <PointagePadProvider mode="GESTION_GERANT"><AnalyseEcarts /></PointagePadProvider>;
}

function AnalyseEcarts() {
  const { utilisateurs } = useUser();
  const { obtenirPointagesGerant } = usePointagePad();
  const { obtenirComparaisonPlanningPointage } = usePlanning();
  const [date, setDate] = useState(dateIso(new Date()));
  const comparaisons = obtenirComparaisonPlanningPointage(date, obtenirPointagesGerant(date));
  function changerDate(delta: number) { const suivante = new Date(`${date}T12:00:00`); suivante.setDate(suivante.getDate() + delta); setDate(dateIso(suivante)); }
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}><Text style={styles.surtitre}>GESTION ENTREPRISE</Text><Text style={styles.titre}>Analyse du jour</Text><View style={styles.navigation}><Pressable style={styles.fleche} onPress={() => changerDate(-1)}><Text style={styles.flecheTexte}>‹</Text></Pressable><Text style={styles.date}>{new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Text><Pressable style={styles.fleche} onPress={() => changerDate(1)}><Text style={styles.flecheTexte}>›</Text></Pressable></View>
    <View style={styles.table}><View style={styles.entete}><Text style={[styles.cellule, styles.salarie]}>Salarié</Text><Text style={styles.cellule}>Prévu</Text><Text style={styles.cellule}>Réalisé</Text><Text style={styles.cellule}>Écart</Text></View>{comparaisons.map((comparaison) => { const utilisateur = utilisateurs.find((element) => element.id === comparaison.utilisateurId); const etat = indicateur(comparaison.ecart); const serviceTermine = Boolean(comparaison.pointageReel.departService); const serviceCommence = Boolean(comparaison.pointageReel.arrivee); return <View key={comparaison.id} style={styles.ligne}><View style={[styles.cellule, styles.salarie]}><Text style={styles.nom}>{utilisateur?.nom ?? "Salarié"}</Text><Text style={styles.horaires}>{comparaison.planningPrevu.debut || "—"}–{comparaison.planningPrevu.fin || "—"}</Text></View><Text style={styles.valeur}>{duree(comparaison.tempsPrevu)}</Text><Text style={styles.valeur}>{serviceTermine ? duree(comparaison.tempsReel) : serviceCommence ? "En cours" : "—"}</Text><View style={styles.cellule}><Text style={[styles.ecart, Math.abs(comparaison.ecart) > 30 && styles.ecartFort]}>{serviceTermine ? ecart(comparaison.ecart) : "—"}</Text><Text style={styles.indicateur}>{serviceTermine ? `${etat.emoji} ${etat.texte}` : serviceCommence ? "⏳ Service ouvert" : "Non pointé"}</Text></View></View>; })}{comparaisons.length === 0 ? <Text style={styles.vide}>Aucun planning disponible pour cette date.</Text> : null}</View>
    <View style={styles.note}><Text style={styles.noteTitre}>Validation future</Text><Text style={styles.noteTexte}>Les écarts restent informatifs. Une validation gérant sera ajoutée avant l’export comptable.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#080706" }, contenu: { padding: 18, gap: 16, paddingBottom: 50 }, surtitre: { color: "#96712a", textAlign: "center", fontSize: 10, letterSpacing: 3 }, titre: { color: "#f1d37b", fontSize: 29, fontWeight: "900", textAlign: "center" }, navigation: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 15 }, fleche: { width: 48, height: 48, borderWidth: 1, borderColor: "#705625", borderRadius: 12, alignItems: "center", justifyContent: "center" }, flecheTexte: { color: "#e6c96f", fontSize: 29 }, date: { color: "#eadfca", minWidth: 210, textAlign: "center", fontWeight: "800" }, table: { backgroundColor: "#15120d", borderWidth: 1, borderColor: "#554321", borderRadius: 15, overflow: "hidden" }, entete: { flexDirection: "row", backgroundColor: "#292010", minHeight: 48, alignItems: "center" }, ligne: { flexDirection: "row", minHeight: 76, alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#4a3b22" }, cellule: { flex: 1, padding: 8, color: "#d9caa8", textAlign: "center" }, salarie: { flex: 1.4 }, nom: { color: "#f2e5c7", fontWeight: "900" }, horaires: { color: "#8f856f", fontSize: 11, marginTop: 3 }, valeur: { flex: 1, color: "#eed176", fontWeight: "900", textAlign: "center" }, ecart: { color: "#dfb85a", fontWeight: "900", textAlign: "center" }, ecartFort: { color: "#e77669" }, indicateur: { color: "#a79c84", fontSize: 9, textAlign: "center", marginTop: 4 }, vide: { color: "#9b917c", textAlign: "center", padding: 24 }, note: { borderWidth: 1, borderColor: "#54431f", borderRadius: 13, padding: 14, backgroundColor: "#15120d" }, noteTitre: { color: "#dabe69", fontWeight: "900" }, noteTexte: { color: "#9e947f", marginTop: 5, lineHeight: 19 } });
