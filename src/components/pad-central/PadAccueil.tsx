import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PadAccueil({ entreprise, onPrendreService, onTerminerService }: { entreprise: string; onPrendreService: () => void; onTerminerService: () => void }) {
  return <><Text style={styles.marque}>👑 RESTOPILOT</Text><Text style={styles.soustitre}>L’Empire vous souhaite la bienvenue</Text><Text style={styles.entreprise}>{entreprise}</Text><Text style={styles.horloge}>{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</Text><View style={styles.actions}><Action couleur="#248554" texte="🟢  PRENDRE MON SERVICE" onPress={onPrendreService} /><Action couleur="#7e2926" texte="🔴  TERMINER MON SERVICE" onPress={onTerminerService} /></View></>;
}

function Action({ couleur, texte, onPress }: { couleur: string; texte: string; onPress: () => void }) { return <Pressable style={[styles.bouton, { backgroundColor: couleur }]} onPress={onPress}><Text style={styles.boutonTexte}>{texte}</Text></Pressable>; }
const styles = StyleSheet.create({ marque: { color: "#f1d17a", fontSize: 38, fontWeight: "900", letterSpacing: 4, textAlign: "center" }, soustitre: { color: "#e5d8ba", fontSize: 19, textAlign: "center" }, entreprise: { color: "#9c917b", fontSize: 15 }, horloge: { color: "#fff", fontSize: 58, fontWeight: "300", marginVertical: 14 }, actions: { width: "100%", gap: 18 }, bouton: { minHeight: 128, borderRadius: 22, alignItems: "center", justifyContent: "center", padding: 20 }, boutonTexte: { color: "#fff", fontSize: 23, fontWeight: "900", textAlign: "center" } });
