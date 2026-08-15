import { useEffect, useRef } from "react";
import { Animated, Image, type ImageSourcePropType, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { AmbiancePointage } from "@/types/ambiance";

const DUREE_AFFICHAGE_MS = 3800;

export function ServiceWelcomePopup({ ambiance, avatar, onFermer }: { ambiance: AmbiancePointage | null; avatar?: ImageSourcePropType; onFermer: () => void }) {
  const opacite = useRef(new Animated.Value(0)).current;
  const echelle = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (!ambiance) return;
    opacite.setValue(0); echelle.setValue(0.9);
    Animated.parallel([Animated.timing(opacite, { toValue: 1, duration: 220, useNativeDriver: true }), Animated.spring(echelle, { toValue: 1, friction: 7, tension: 80, useNativeDriver: true })]).start();
    const fermeture = setTimeout(onFermer, DUREE_AFFICHAGE_MS);
    return () => clearTimeout(fermeture);
  }, [ambiance, echelle, onFermer, opacite]);
  return <Modal animationType="none" onRequestClose={onFermer} transparent visible={ambiance !== null}><View style={styles.fond}><Animated.View accessibilityLabel="Message d’ambiance après pointage" accessibilityViewIsModal style={[styles.carte, { opacity: opacite, transform: [{ scale: echelle }] }]}><Image accessibilityLabel="Avatar Empire" resizeMode="cover" source={avatar ?? require("@/../assets/haccp/empereur.png")} style={styles.avatar} /><Text style={styles.titre}>{ambiance?.titre}</Text><Text style={styles.prenom}>{ambiance?.prenom}</Text><Text style={styles.meta}>{ambiance?.poste} · {ambiance?.heure}</Text><Text style={styles.message}>{ambiance?.message}</Text><Text style={styles.emojis}>{ambiance?.emojis.join(" ")}</Text><Pressable accessibilityRole="button" onPress={onFermer} style={styles.bouton}><Text style={styles.boutonTexte}>Fermer</Text></Pressable></Animated.View></View></Modal>;
}

const styles = StyleSheet.create({ fond: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.9)", flex: 1, justifyContent: "center", padding: 24 }, carte: { alignItems: "center", backgroundColor: "#18130b", borderColor: "#d0a13b", borderRadius: 28, borderWidth: 2, maxWidth: 500, padding: 26, width: "100%" }, avatar: { height: 160, width: 120, borderRadius: 14, borderWidth: 1, borderColor: "#d0a13b", marginBottom: 10 }, titre: { color: "#f3d478", fontSize: 27, fontWeight: "900", textAlign: "center" }, prenom: { color: "#fff0cb", fontSize: 31, fontWeight: "900", marginTop: 8 }, meta: { color: "#aa9e86", fontSize: 16, marginTop: 3 }, message: { color: "#eee2c7", fontSize: 20, lineHeight: 28, marginTop: 18, textAlign: "center" }, emojis: { fontSize: 27, marginTop: 12 }, bouton: { backgroundColor: "#a97c2b", borderRadius: 18, marginTop: 22, paddingHorizontal: 28, paddingVertical: 12 }, boutonTexte: { color: "#100b04", fontSize: 17, fontWeight: "900" } });
