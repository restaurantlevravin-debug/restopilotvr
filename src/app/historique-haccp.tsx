import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useHaccp } from "@/context/HaccpContext";
import {
  exporterActionsCorrectivesPdf,
  exporterDossierHaccpCompletPdf,
  exporterTemperaturesPdf,
  exporterTracabilitePdf,
} from "@/services/haccpPdf";

export default function HistoriqueHaccp() {
  const { releves, traces, actions, scoreHaccp } = useHaccp();

  async function lancerExport(nom: string, exportPdf: () => Promise<void>) {
    try {
      await exportPdf();
    } catch (error) {
      console.error(error);
      Alert.alert("Export impossible", `Le PDF ${nom} n'a pas pu être généré.`);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📋 Dossier HACCP</Text>
      <Text style={styles.subtitle}>Historique complet — export, recherche et filtres à venir.</Text>

      <View style={styles.exportsCard}>
        <Text style={styles.exportsTitle}>Exports PDF HACCP</Text>
        <Text style={styles.exportsDescription}>Les PDF sont générés localement, puis prêts à partager ou imprimer.</Text>
        <Pressable style={styles.exportButton} onPress={() => lancerExport("températures", () => exporterTemperaturesPdf(releves))}>
          <Text style={styles.exportButtonText}>📄 Export températures</Text>
        </Pressable>
        <Pressable style={styles.exportButton} onPress={() => lancerExport("traçabilité", () => exporterTracabilitePdf(traces))}>
          <Text style={styles.exportButtonText}>📄 Export traçabilité</Text>
        </Pressable>
        <Pressable style={styles.exportButton} onPress={() => lancerExport("actions correctives", () => exporterActionsCorrectivesPdf(actions))}>
          <Text style={styles.exportButtonText}>📄 Export actions</Text>
        </Pressable>
        <Pressable style={styles.completeExportButton} onPress={() => lancerExport("dossier HACCP complet", () => exporterDossierHaccpCompletPdf({ releves, traces, actions, scoreHaccp }))}>
          <Text style={styles.exportButtonText}>📁 Export dossier complet</Text>
        </Pressable>
      </View>

      <Section title="🌡 HISTORIQUE DES TEMPÉRATURES">
        {releves.length === 0 ? (
          <EmptyState message="Aucun relevé de température enregistré." />
        ) : (
          [...releves].reverse().map((releve) => (
            <View key={releve.id} style={styles.record}>
              <Text style={styles.recordTitle}>{releve.date} · {releve.periode === "matin" ? "Matin" : "Soir"}</Text>
              <Text style={styles.line}>Heure réelle : {releve.heure}</Text>
              <Text style={styles.line}>Température : {releve.temperature}</Text>
              <Text style={styles.line}>Responsable : {releve.responsable}</Text>
              <Text style={[styles.status, releve.conforme ? styles.statusOk : styles.statusKo]}>
                {releve.conforme ? "✅ Conforme" : "❌ Non conforme"}
              </Text>
              {releve.photo ? (
                <View style={styles.photoBlock}>
                  <Text style={styles.photoLabel}>📷 Preuve photo jointe</Text>
                  <Image source={{ uri: releve.photo }} style={styles.thumbnail} accessibilityLabel={`Preuve du relevé du ${releve.date}`} />
                </View>
              ) : (
                <Text style={styles.line}>Photo de preuve : non jointe</Text>
              )}
            </View>
          ))
        )}
      </Section>

      <Section title="📦 HISTORIQUE TRAÇABILITÉ PRODUITS">
        {traces.length === 0 ? (
          <EmptyState message="Aucune réception enregistrée." />
        ) : (
          [...traces].reverse().map((trace) => (
            <View key={trace.id} style={styles.record}>
              <Text style={styles.recordTitle}>📦 {trace.produit}</Text>
              <Text style={styles.line}>Fournisseur : {trace.fournisseur}</Text>
              <Text style={styles.line}>Date réception : {trace.dateReception}</Text>
              <Text style={styles.line}>DLC : {trace.dlc || "Non renseignée"}</Text>
              <Text style={styles.line}>Température réception : {trace.temperatureReception || "Non renseignée"}</Text>
              <Text style={styles.line}>Lot : {trace.lot || "Non renseigné"}</Text>
              <Text style={styles.line}>Commentaire : {trace.commentaire || "Aucun"}</Text>
              {trace.photo ? (
                <View style={styles.photoBlock}>
                  <Text style={styles.photoLabel}>📷 Étiquette photographiée</Text>
                  <Image source={{ uri: trace.photo }} style={styles.thumbnail} accessibilityLabel={`Étiquette de ${trace.produit}`} />
                </View>
              ) : (
                <Text style={styles.line}>Photo d'étiquette : non jointe</Text>
              )}
            </View>
          ))
        )}
      </Section>

      <Section title="⚠️ ACTIONS CORRECTIVES">
        {actions.length === 0 ? (
          <EmptyState message="Aucune action corrective enregistrée." />
        ) : (
          [...actions].reverse().map((action) => (
            <View key={action.id} style={styles.record}>
              <Text style={styles.recordTitle}>Problème : {action.probleme}</Text>
              <Text style={styles.line}>Action réalisée : {action.action}</Text>
              <Text style={styles.line}>Responsable : {action.responsable}</Text>
              <Text style={styles.line}>Date : {action.date}</Text>
              {action.commentaire ? <Text style={styles.line}>Commentaire : {action.commentaire}</Text> : null}
              <Text style={styles.line}>Résolution : {action.resolution || "En attente"}</Text>
              {action.photoPreuve ? (
                <View style={styles.photoBlock}>
                  <Text style={styles.photoLabel}>📷 Preuve d'anomalie</Text>
                  <Image source={{ uri: action.photoPreuve }} style={styles.thumbnail} accessibilityLabel={`Preuve d'anomalie du ${action.date}`} />
                </View>
              ) : null}
            </View>
          ))
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyState({ message }: { message: string }) {
  return <Text style={styles.empty}>{message}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  content: { padding: 20, paddingBottom: 36 },
  title: { fontSize: 30, fontWeight: "bold", color: "#00695C", textAlign: "center", marginTop: 20 },
  subtitle: { color: "#666666", textAlign: "center", marginTop: 8, marginBottom: 22 },
  exportsCard: { backgroundColor: "#FFFFFF", borderRadius: 15, borderLeftWidth: 6, borderLeftColor: "#00695C", padding: 18, marginBottom: 18 },
  exportsTitle: { color: "#00695C", fontSize: 19, fontWeight: "bold", marginBottom: 6 },
  exportsDescription: { color: "#555555", lineHeight: 20, marginBottom: 14 },
  exportButton: { backgroundColor: "#B08D57", borderRadius: 10, marginBottom: 10, padding: 13 },
  completeExportButton: { backgroundColor: "#00695C", borderRadius: 10, padding: 13 },
  exportButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold", textAlign: "center" },
  section: { backgroundColor: "#FFFFFF", borderRadius: 15, borderLeftWidth: 6, borderLeftColor: "#B08D57", padding: 18, marginBottom: 18 },
  sectionTitle: { color: "#00695C", fontSize: 19, fontWeight: "bold", marginBottom: 12 },
  record: { borderTopWidth: 1, borderTopColor: "#E8E8E8", paddingVertical: 12 },
  recordTitle: { color: "#1F4540", fontWeight: "bold", marginBottom: 5 },
  line: { color: "#4E4E4E", marginBottom: 3 },
  status: { fontWeight: "bold", marginTop: 4 },
  statusOk: { color: "#00695C" },
  statusKo: { color: "#B05A3C" },
  empty: { color: "#777777", fontStyle: "italic" },
  photoBlock: { marginTop: 8 },
  photoLabel: { color: "#00695C", fontWeight: "bold", marginBottom: 8 },
  thumbnail: { width: 120, height: 120, borderRadius: 10, backgroundColor: "#E8E8E8" },
});
