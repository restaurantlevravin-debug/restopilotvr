import { useEffect, useRef } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import type { AmbiancePointage } from "@/types/ambiance";
import type { Utilisateur } from "@/types/entreprise";
import type { Pointage } from "@/types/pointage";
import type { PresenceJournee } from "@/types/presence";

function horaire(heure?: string) {
  return heure
    ? heure.replace(/(\d{1,2}):(\d{2})(?::\d{2})?/g, "$1h$2")
    : "Non planifié";
}

export default function ConfirmationPointage({ pointage, utilisateur, presence, ambiance, avatar, onFermer }: { pointage: Pointage; utilisateur: Utilisateur; presence?: PresenceJournee; ambiance: AmbiancePointage | null; avatar?: ImageSourcePropType; onFermer: () => void }) {
  const apparition = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(apparition, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }).start();
    const minuteur = setTimeout(onFermer, 3800);
    return () => clearTimeout(minuteur);
  }, [apparition, onFermer]);
  const titre = ambiance?.titre ?? (pointage.type === "ARRIVEE" ? "👑 BON SERVICE !" : "👑 SERVICE TERMINÉ !");
  return <View style={styles.fond}><Animated.View style={[styles.carte, { opacity: apparition, transform: [{ scale: apparition }] }]}>{avatar ? <Image source={avatar} style={styles.avatar} /> : <Text style={styles.couronne}>👑</Text>}<Text style={styles.titre}>{titre}</Text><Text style={styles.nom}>{utilisateur.nom}</Text><Detail label="Poste" valeur={utilisateur.poste || "Équipe"} /><View style={styles.details}><Detail label="Planning prévu" valeur={horaire(presence?.horairePrevu)} /><Detail label="Pointage" valeur={horaire(pointage.heure)} /></View><View style={styles.statut}><Text style={styles.label}>Statut</Text><Text style={styles.statutValeur}>{presence?.statut === "EN_SERVICE" ? "🟢 EN SERVICE" : presence?.statut === "TERMINE" ? "⚪ TERMINÉ" : "⚪ NON ARRIVÉ"}</Text></View><Text style={styles.fermeture}>Retour automatique…</Text></Animated.View></View>;
}

function Detail({ label, valeur }: { label: string; valeur: string }) { return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.valeur}>{valeur}</Text></View>; }
const styles = StyleSheet.create({ fond: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: 28 }, carte: { width: "100%", maxWidth: 560, backgroundColor: "#18130b", borderWidth: 2, borderColor: "#c99b36", borderRadius: 26, padding: 28, alignItems: "center", gap: 10 }, avatar: { width: 90, height: 120, borderRadius: 16, borderWidth: 2, borderColor: "#c99b36" }, couronne: { fontSize: 54 }, titre: { color: "#f3d478", fontSize: 29, fontWeight: "900", textAlign: "center" }, nom: { color: "#fff0cb", fontSize: 25, fontWeight: "900", textAlign: "center" }, details: { width: "100%", flexDirection: "row", gap: 12, marginTop: 6 }, detail: { flex: 1, alignSelf: "stretch", backgroundColor: "#0c0a07", borderRadius: 13, padding: 13, alignItems: "center" }, statut: { width: "100%", backgroundColor: "#292010", borderRadius: 13, padding: 12, alignItems: "center" }, label: { color: "#918671", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }, valeur: { color: "#f2d276", fontSize: 19, fontWeight: "900", marginTop: 4, textAlign: "center" }, statutValeur: { color: "#78d69a", fontSize: 18, fontWeight: "900", marginTop: 4 }, fermeture: { color: "#7e7563", fontSize: 11, marginTop: 5 } });
