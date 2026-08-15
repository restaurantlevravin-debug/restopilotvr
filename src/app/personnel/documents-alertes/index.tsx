import { Redirect, router, type Href } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useDocuments } from "@/context/DocumentContext";
import { useUser } from "@/context/UserContext";

export default function AlertesDocumentsScreen() {
  const { utilisateurActif, utilisateurs } = useUser();
  const { obtenirAlertesDocuments } = useDocuments();
  if (utilisateurActif?.role !== "GERANT") return <Redirect href="/" />;
  const alertes = obtenirAlertesDocuments();
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}>
    <Text style={styles.surtitre}>DOSSIERS ADMINISTRATIFS</Text><Text style={styles.titre}>Documents à surveiller</Text>
    <Pressable style={styles.bouton} onPress={() => router.push("/personnel/documents" as Href)}><Text style={styles.boutonTexte}>Gérer les documents</Text></Pressable>
    {alertes.length === 0 ? <View style={styles.carte}><Text style={styles.valide}>✓ Aucune échéance dans les 30 prochains jours</Text></View> : alertes.map((alerte) => {
      const salarie = utilisateurs.find((utilisateur) => utilisateur.id === alerte.document.utilisateurId);
      const couleur = alerte.niveau === "EXPIRE" ? "#df6b60" : "#d4bd72";
      return <View key={alerte.document.id} style={[styles.carte, { borderLeftColor: couleur }]}><Text style={styles.nom}>{salarie?.nom ?? "Salarié inconnu"}</Text><Text style={styles.document}>📄 {alerte.document.nom}</Text><Text style={styles.meta}>Expiration : {alerte.document.dateExpiration ?? "—"}</Text><Text style={[styles.statut, { color: couleur }]}>{alerte.document.statut.replaceAll("_", " ")}</Text><Text style={styles.message}>{alerte.message}</Text></View>;
    })}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#080706" }, contenu: { padding: 18, gap: 13, paddingBottom: 50 }, surtitre: { color: "#98732b", letterSpacing: 3, fontSize: 10, textAlign: "center" }, titre: { color: "#f1d47e", fontSize: 28, fontWeight: "900", textAlign: "center" }, bouton: { minHeight: 48, borderWidth: 1, borderColor: "#806326", borderRadius: 10, alignItems: "center", justifyContent: "center" }, boutonTexte: { color: "#e6ca78", fontWeight: "900" }, carte: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#54431f", borderLeftWidth: 5, borderLeftColor: "#6a8d62", borderRadius: 14, padding: 15, gap: 5 }, valide: { color: "#80c895", textAlign: "center", fontWeight: "800" }, nom: { color: "#f4e8cb", fontSize: 17, fontWeight: "900" }, document: { color: "#dbc070", fontWeight: "800" }, meta: { color: "#a69b84" }, statut: { fontSize: 12, fontWeight: "900" }, message: { color: "#bbb09a", lineHeight: 19, marginTop: 5 } });
