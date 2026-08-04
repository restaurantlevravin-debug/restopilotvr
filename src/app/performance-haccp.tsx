import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useHaccp } from "@/context/HaccpContext";

export default function PerformanceHaccp() {
  const { scoreHaccp } = useHaccp();
  const tauxConformite = scoreHaccp.nombreReleves === 0 ? 0 : Math.round((scoreHaccp.nombreConformes / scoreHaccp.nombreReleves) * 100);
  const prochainGrade = scoreHaccp.grade === "PADAWAN HACCP" ? "MONSTRE HACCP : 100 relevés conformes à 95%" : scoreHaccp.grade === "MONSTRE HACCP" ? "EMPEREUR HACCP : 500 relevés conformes à 98%" : "Niveau maximum atteint";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🏆 Performance HACCP</Text>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>Score total</Text>
        <Text style={styles.score}>{scoreHaccp.totalPoints} pts</Text>
      </View>

      <View style={styles.levelCard}>
        <Text style={styles.levelTitle}>🏆 Niveau HACCP</Text>
        <Text style={styles.grade}>{scoreHaccp.grade}</Text>
        <Text style={styles.progress}>Progression : {prochainGrade}</Text>
      </View>

      <View style={styles.statsCard}>
        <Stat label="Relevés enregistrés" value={String(scoreHaccp.nombreReleves)} />
        <Stat label="Conformité" value={`${tauxConformite}%`} />
        <Stat label="Preuves photos" value={String(scoreHaccp.nombrePhotos)} />
      </View>

      <View style={styles.rankingCard}>
        <Text style={styles.sectionTitle}>👥 Classement équipe</Text>
        <View style={styles.rankLine}>
          <Text style={styles.rank}>1</Text>
          <Text style={styles.team}>Votre équipe</Text>
          <Text style={styles.teamScore}>{scoreHaccp.totalPoints} pts</Text>
        </View>
        <Text style={styles.future}>Le classement multi-équipe sera disponible lors de l’ajout des profils et du partage des données.</Text>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  content: { padding: 20, paddingBottom: 36 },
  title: { color: "#00695C", fontSize: 30, fontWeight: "bold", textAlign: "center", marginVertical: 25 },
  scoreCard: { alignItems: "center", backgroundColor: "#00695C", borderRadius: 18, padding: 26, marginBottom: 18 },
  scoreLabel: { color: "#D7F1EC", fontSize: 18 },
  score: { color: "#FFFFFF", fontSize: 40, fontWeight: "bold", marginTop: 6 },
  levelCard: { backgroundColor: "#081A24", borderColor: "#B08D57", borderRadius: 15, borderWidth: 1, marginBottom: 18, padding: 18 },
  levelTitle: { color: "#D4AF37", fontSize: 19, fontWeight: "bold" },
  grade: { color: "#FFFFFF", fontSize: 24, fontWeight: "bold", marginTop: 8 },
  progress: { color: "#C9DDE0", lineHeight: 20, marginTop: 8 },
  statsCard: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 15, paddingVertical: 18, marginBottom: 18 },
  stat: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  statValue: { color: "#00695C", fontSize: 24, fontWeight: "bold" },
  statLabel: { color: "#666666", fontSize: 12, textAlign: "center", marginTop: 5 },
  rankingCard: { backgroundColor: "#FFFFFF", borderRadius: 15, borderLeftWidth: 6, borderLeftColor: "#B08D57", padding: 18 },
  sectionTitle: { color: "#00695C", fontSize: 20, fontWeight: "bold", marginBottom: 14 },
  rankLine: { flexDirection: "row", alignItems: "center", backgroundColor: "#F4F8F7", borderRadius: 10, padding: 12 },
  rank: { color: "#B08D57", fontSize: 21, fontWeight: "bold", width: 32 },
  team: { color: "#333333", flex: 1, fontWeight: "bold" },
  teamScore: { color: "#00695C", fontWeight: "bold" },
  future: { color: "#777777", fontStyle: "italic", marginTop: 14, lineHeight: 20 },
});
