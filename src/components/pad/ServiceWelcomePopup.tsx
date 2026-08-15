import { Image, type ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";

import type { AmbiancePointage } from "@/types/ambiance";

export default function ServiceWelcomePopup({ ambiance, avatar, heure, onFermer }: { ambiance: AmbiancePointage | null; avatar?: ImageSourcePropType; heure: string; onFermer: () => void }) {
  return <View style={styles.fond}><View style={styles.carte}>{avatar ? <Image source={avatar} style={styles.avatar} /> : <Text style={styles.couronne}>👑</Text>}<Text style={styles.titre}>{ambiance?.titre ?? "Pointage enregistré"}</Text><Text style={styles.message}>{ambiance?.message ?? "Votre pointage a bien été enregistré."}</Text>{ambiance ? <Text style={styles.identite}>{ambiance.prenom} · {ambiance.poste}</Text> : null}<Text style={styles.heure}>{heure.slice(0, 5)}</Text><Pressable style={styles.bouton} onPress={onFermer}><Text style={styles.boutonTexte}>Continuer</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({
  fond: { ...StyleSheet.absoluteFill, zIndex: 10, backgroundColor: "rgba(0,0,0,0.88)", alignItems: "center", justifyContent: "center", padding: 24 },
  carte: { width: "100%", maxWidth: 520, backgroundColor: "#17120a", borderWidth: 2, borderColor: "#c49736", borderRadius: 24, padding: 28, alignItems: "center", gap: 12 },
  couronne: { fontSize: 46 },
  avatar: { width: 96, height: 128, borderRadius: 14, borderWidth: 1, borderColor: "#c49736" },
  titre: { color: "#f3d57d", fontSize: 27, fontWeight: "900", textAlign: "center" },
  message: { color: "#eee2c5", fontSize: 18, lineHeight: 26, textAlign: "center" },
  identite: { color: "#b9aa89", fontWeight: "700" },
  heure: { color: "#fff", fontSize: 34, fontWeight: "900" },
  bouton: { minHeight: 56, alignSelf: "stretch", backgroundColor: "#b0832f", borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 8 },
  boutonTexte: { color: "#100c06", fontSize: 17, fontWeight: "900" },
});
