import { useEffect, useRef } from "react";
import { Animated, Image, type ImageSourcePropType, StyleSheet, Text, View } from "react-native";

import type { AmbiancePointage } from "@/types/ambiance";
import type { Utilisateur } from "@/types/entreprise";
import type { Pointage } from "@/types/pointage";

export default function ConfirmationPointage({ pointage, utilisateur, ambiance, avatar, onFermer }: { pointage: Pointage; utilisateur: Utilisateur; ambiance: AmbiancePointage | null; avatar?: ImageSourcePropType; onFermer: () => void }) {
  const apparition = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(apparition, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }).start();
    const minuteur = setTimeout(onFermer, 3800);
    return () => clearTimeout(minuteur);
  }, [apparition, onFermer]);
  const titre = ambiance?.titre ?? (pointage.type === "ARRIVEE" ? "👑 BON SERVICE !" : "👑 SERVICE TERMINÉ !");
  return <View style={styles.fond}><Animated.View style={[styles.carte, { opacity: apparition, transform: [{ scale: apparition }] }]}>{avatar ? <Image source={avatar} style={styles.avatar} /> : <Text style={styles.couronne}>👑</Text>}<Text style={styles.titre}>{titre}</Text><Text style={styles.message}>{ambiance?.message ?? (pointage.type === "ARRIVEE" ? `Bienvenue ${utilisateur.nom.split(" ")[0]}` : `Merci ${utilisateur.nom.split(" ")[0]}`)}</Text><View style={styles.details}><Detail label="Service" valeur={utilisateur.poste || "Équipe"} /><Detail label="Heure" valeur={pointage.heure.slice(0, 5)} /></View><Text style={styles.fermeture}>Retour automatique…</Text></Animated.View></View>;
}

function Detail({ label, valeur }: { label: string; valeur: string }) { return <View style={styles.detail}><Text style={styles.label}>{label}</Text><Text style={styles.valeur}>{valeur}</Text></View>; }
const styles = StyleSheet.create({ fond: { ...StyleSheet.absoluteFill, zIndex: 20, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center", padding: 28 }, carte: { width: "100%", maxWidth: 560, backgroundColor: "#18130b", borderWidth: 2, borderColor: "#c99b36", borderRadius: 26, padding: 28, alignItems: "center", gap: 13 }, avatar: { width: 120, height: 160, borderRadius: 16, borderWidth: 2, borderColor: "#c99b36" }, couronne: { fontSize: 54 }, titre: { color: "#f3d478", fontSize: 29, fontWeight: "900", textAlign: "center" }, message: { color: "#f1e5ca", fontSize: 19, lineHeight: 27, textAlign: "center" }, details: { width: "100%", flexDirection: "row", gap: 12, marginTop: 6 }, detail: { flex: 1, backgroundColor: "#0c0a07", borderRadius: 13, padding: 13, alignItems: "center" }, label: { color: "#918671", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }, valeur: { color: "#f2d276", fontSize: 19, fontWeight: "900", marginTop: 4 }, fermeture: { color: "#7e7563", fontSize: 11, marginTop: 5 } });
