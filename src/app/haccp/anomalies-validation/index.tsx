import { Redirect } from "expo-router";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useAnomaliesHaccp } from "@/context/AnomalieHaccpContext";
import { useHaccp } from "@/context/HaccpContext";
import { useUser } from "@/context/UserContext";

const ROLES = new Set(["GERANT", "CHEF_CUISINE", "MAITRE_HOTEL"]);

export default function ValidationAnomaliesScreen() {
  const { anomalies, validerCorrection, cloturerAnomalie } = useAnomaliesHaccp();
  const { controlesRealises, pointsControle } = useHaccp();
  const { utilisateurActif, utilisateurs } = useUser();
  if (!utilisateurActif || !ROLES.has(utilisateurActif.role)) return <Redirect href="/haccp" />;
  const responsableId = utilisateurActif.id;

  const ouvertes = anomalies.filter((a) => a.statut !== "CLOTUREE");
  const critiques = ouvertes.filter((a) => a.priorite === "CRITIQUE").length;
  const resolues = anomalies.filter((a) => a.dateCloture);
  const moyenneHeures = resolues.length === 0 ? 0 : resolues.reduce((total, a) => {
    const debut = new Date(`${a.dateCreation}T${a.heureCreation}`).getTime();
    const fin = new Date(a.dateCloture!).getTime();
    return total + Math.max(0, fin - debut) / 3_600_000;
  }, 0) / resolues.length;

  function pointPour(controleId: string) {
    const controle = controlesRealises.find((c) => c.id === controleId);
    return pointsControle.find((p) => p.id === controle?.pointControleId)?.nom ?? "Déclaration directe";
  }

  async function valider(id: string) {
    const succes = await validerCorrection(id, { methodeValidation: "CLIC", utilisateurId: responsableId });
    Alert.alert(succes ? "Correction validée" : "Validation refusée", succes ? "La correction rapporte 10 points au déclarant." : "Vous ne pouvez pas valider votre propre correction.");
  }

  async function cloturer(id: string) {
    const succes = await cloturerAnomalie(id);
    Alert.alert(succes ? "Anomalie clôturée" : "Clôture refusée", succes ? "Le dossier est désormais clos." : "Une correction validée par un autre responsable est requise.");
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}>
    <Text style={styles.surtitre}>PILOTAGE HACCP</Text><Text style={styles.titre}>{utilisateurActif.role === "GERANT" ? "Historique anomalies HACCP" : "Anomalies en attente"}</Text>
    {utilisateurActif.role === "GERANT" && <View style={styles.stats}>
      <Stat valeur={anomalies.length} label="Anomalies" /><Stat valeur={ouvertes.length} label="Ouvertes" /><Stat valeur={critiques} label="Critiques" /><Stat valeur={`${moyenneHeures.toFixed(1)} h`} label="Résolution moyenne" />
    </View>}
    {anomalies.length === 0 ? <View style={styles.carte}><Text style={styles.secondaire}>Aucune anomalie enregistrée.</Text></View> : anomalies.map((a) => {
      const auteur = utilisateurs.find((u) => u.id === a.utilisateurDeclarationId)?.nom ?? "Utilisateur";
      return <View key={a.id} style={[styles.carte, a.priorite === "CRITIQUE" && styles.carteCritique]}>
        <View style={styles.entete}><Text style={styles.nom}>{pointPour(a.controleId)}</Text><Text style={styles.statut}>{a.statut}</Text></View>
        <Text style={styles.type}>{a.type} · {a.priorite}</Text><Text style={styles.description}>{a.description}</Text>
        <Image source={{ uri: a.photo }} style={styles.photo} /><Text style={styles.secondaire}>Déclarée par {auteur} · {a.dateCreation} à {a.heureCreation}</Text>
        <Text style={styles.action}>Action proposée : {a.actionCorrective ?? "Non renseignée"}</Text>
        {a.statut !== "VALIDEE" && a.statut !== "CLOTUREE" && <Pressable style={styles.valider} onPress={() => void valider(a.id)}><Text style={styles.validerTexte}>✓ Valider la correction</Text></Pressable>}
        {a.statut === "VALIDEE" && <Pressable style={styles.cloturer} onPress={() => void cloturer(a.id)}><Text style={styles.cloturerTexte}>Clôturer l'anomalie</Text></Pressable>}
      </View>;
    })}
  </ScrollView></SafeAreaView>;
}

function Stat({ valeur, label }: { valeur: string | number; label: string }) { return <View style={styles.stat}><Text style={styles.statValeur}>{valeur}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 18, gap: 14, paddingBottom: 50 }, surtitre: { color: "#8d6922", letterSpacing: 3, textAlign: "center", fontSize: 11 }, titre: { color: "#f4d579", fontSize: 26, fontWeight: "900", textAlign: "center" }, stats: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, stat: { width: "48%", backgroundColor: "#171510", borderWidth: 1, borderColor: "#61491b", borderRadius: 12, padding: 13 }, statValeur: { color: "#f3d57d", fontSize: 22, fontWeight: "900" }, statLabel: { color: "#a99d84", fontSize: 12 }, carte: { backgroundColor: "#171510", borderWidth: 1, borderColor: "#6d5220", borderRadius: 15, padding: 15, gap: 9 }, carteCritique: { borderColor: "#a43f32" }, entete: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, nom: { color: "#f1d995", fontSize: 18, fontWeight: "800", flex: 1 }, statut: { color: "#dbbd6c", fontSize: 11, fontWeight: "900" }, type: { color: "#c7b68c", fontWeight: "700" }, description: { color: "#eee4cd", fontSize: 15 }, photo: { width: "100%", height: 170, borderRadius: 11 }, secondaire: { color: "#a99d86" }, action: { color: "#dfcea5", fontWeight: "600" }, valider: { minHeight: 52, backgroundColor: "#a87a25", borderRadius: 11, alignItems: "center", justifyContent: "center" }, validerTexte: { color: "#090806", fontWeight: "900" }, cloturer: { minHeight: 52, borderWidth: 1, borderColor: "#c3983f", borderRadius: 11, alignItems: "center", justifyContent: "center" }, cloturerTexte: { color: "#f0d486", fontWeight: "900" } });
