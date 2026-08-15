import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { usePlanning } from "@/context/PlanningContext";
import { useUser } from "@/context/UserContext";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

export default function MonPlanningScreen() {
  const { utilisateurActif } = useUser();
  const { obtenirPlanningUtilisateur, calculerHeures } = usePlanning();
  const maintenant = new Date();
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const resultat = obtenirPlanningUtilisateur(utilisateurActif?.id, mois, annee);

  function changerMois(delta: number) { const date = new Date(annee, mois - 1 + delta, 1); setMois(date.getMonth() + 1); setAnnee(date.getFullYear()); }
  const jours = resultat?.ligne.jours.filter((jour) => jour.matin.heureDebut || jour.soir.heureDebut || jour.remarque) ?? [];
  const calcul = resultat ? calculerHeures(resultat.ligne) : undefined;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}>
    <Text style={styles.surtitre}>RESTOPILOT</Text><Text style={styles.titre}>Mon planning</Text>
    <View style={styles.navigation}><Pressable style={styles.fleche} onPress={() => changerMois(-1)}><Text style={styles.flecheTexte}>‹</Text></Pressable><Text style={styles.mois}>{MOIS[mois - 1]} {annee}</Text><Pressable style={styles.fleche} onPress={() => changerMois(1)}><Text style={styles.flecheTexte}>›</Text></Pressable></View>
    {!resultat ? <View style={styles.carte}><Text style={styles.vide}>Aucun planning disponible pour cette période.</Text></View> : <>
      <View style={styles.resume}><Text style={styles.nom}>{resultat.ligne.nom}</Text><Text style={styles.poste}>{resultat.ligne.poste}</Text><View style={styles.stats}><Stat valeur={jours.length} label="Jours planifiés" /><Stat valeur={`${calcul?.heuresCalculees ?? 0} h`} label="Heures calculées" /></View><Text style={styles.pause}>Pause repas de 30 minutes déduite par période travaillée.</Text></View>
      {jours.length === 0 ? <View style={styles.carte}><Text style={styles.vide}>Aucun service prévu.</Text></View> : jours.map((jour) => <View key={jour.date} style={styles.carte}><Text style={styles.date}>{new Date(`${jour.date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Text>{jour.matin.heureDebut && <View style={styles.service}><Text style={styles.serviceNom}>☀️ Matin</Text><Text style={styles.horaire}>{jour.matin.heureDebut} — {jour.matin.heureFin}</Text></View>}{jour.soir.heureDebut && <View style={styles.service}><Text style={styles.serviceNom}>🌙 Soir</Text><Text style={styles.horaire}>{jour.soir.heureDebut} — {jour.soir.heureFin}</Text></View>}{jour.remarque && <Text style={styles.remarque}>{jour.remarque}{jour.remarqueLibre ? ` — ${jour.remarqueLibre}` : ""}</Text>}</View>)}
    </>}
  </ScrollView></SafeAreaView>;
}

function Stat({ valeur, label }: { valeur: string | number; label: string }) { return <View style={styles.stat}><Text style={styles.statValeur}>{valeur}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 18, gap: 14, paddingBottom: 50 }, surtitre: { color: "#8c6a26", textAlign: "center", letterSpacing: 3, fontSize: 10 }, titre: { color: "#f2d67f", fontSize: 28, fontWeight: "900", textAlign: "center" }, navigation: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 18 }, fleche: { width: 46, height: 46, borderWidth: 1, borderColor: "#70551f", borderRadius: 12, alignItems: "center", justifyContent: "center" }, flecheTexte: { color: "#e5c56d", fontSize: 29 }, mois: { color: "#eee1c1", fontWeight: "800", fontSize: 18, minWidth: 165, textAlign: "center" }, resume: { backgroundColor: "#1b170f", borderWidth: 1, borderColor: "#9b7325", borderRadius: 16, padding: 18, gap: 7 }, nom: { color: "#f1d78a", fontSize: 22, fontWeight: "900" }, poste: { color: "#c5b89b" }, stats: { flexDirection: "row", gap: 8, marginTop: 6 }, stat: { flex: 1, backgroundColor: "#292319", borderRadius: 11, padding: 12 }, statValeur: { color: "#f0d276", fontSize: 21, fontWeight: "900" }, statLabel: { color: "#a99c84", fontSize: 11 }, pause: { color: "#8f846f", fontSize: 11 }, carte: { backgroundColor: "#16140f", borderWidth: 1, borderColor: "#5f4a22", borderRadius: 14, padding: 15, gap: 10 }, vide: { color: "#aaa08c", textAlign: "center" }, date: { color: "#ecd185", fontSize: 17, fontWeight: "900", textTransform: "capitalize" }, service: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#221e17", borderRadius: 10, padding: 12 }, serviceNom: { color: "#cdbb91", fontWeight: "700" }, horaire: { color: "#f2e5c5", fontSize: 16, fontWeight: "800" }, remarque: { color: "#e0b95a", fontWeight: "700" } });
