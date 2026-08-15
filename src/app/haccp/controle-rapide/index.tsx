import { SafeAreaView, StyleSheet, Text } from "react-native";

import { ControleRapide } from "@/components/haccp/ControleRapide";

export default function ControleRapideScreen() {
  return <SafeAreaView style={styles.page}>
    <Text style={styles.surtitre}>EMPIRE RESTOPILOT</Text>
    <Text style={styles.titre}>Mes contrôles HACCP</Text>
    <ControleRapide />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#090909", paddingTop: 10 },
  surtitre: { color: "#876720", letterSpacing: 3, fontSize: 10, textAlign: "center" },
  titre: { color: "#f4d579", fontSize: 27, fontWeight: "900", textAlign: "center", marginTop: 5 },
});
