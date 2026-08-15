import { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { AmbiancePointage } from "@/types/ambiance";

const DUREE_AFFICHAGE_MS = 4500;

export function ServiceWelcomePopup({
  ambiance,
  onFermer,
}: {
  ambiance: AmbiancePointage | null;
  onFermer: () => void;
}) {
  const opacite = useRef(new Animated.Value(0)).current;
  const echelle = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!ambiance) {
      return;
    }

    opacite.setValue(0);
    echelle.setValue(0.9);
    Animated.parallel([
      Animated.timing(opacite, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(echelle, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const fermetureAutomatique = setTimeout(onFermer, DUREE_AFFICHAGE_MS);
    return () => clearTimeout(fermetureAutomatique);
  }, [ambiance, echelle, onFermer, opacite]);

  return (
    <Modal
      animationType="none"
      onRequestClose={onFermer}
      transparent
      visible={ambiance !== null}
    >
      <View style={styles.fond}>
        <Animated.View
          accessibilityLabel="Message d'ambiance après pointage"
          accessibilityViewIsModal
          style={[
            styles.carte,
            { opacity: opacite, transform: [{ scale: echelle }] },
          ]}
        >
          <Image
            accessibilityLabel="Empereur HACCP"
            resizeMode="contain"
            source={require("@/../assets/haccp/empereur.png")}
            style={styles.empereur}
          />

          <Text style={styles.titre}>{ambiance?.titre}</Text>
          <Text style={styles.prenom}>{ambiance?.prenom}</Text>
          <Text style={styles.meta}>
            {ambiance?.poste} · {ambiance?.heure}
          </Text>
          <Text style={styles.message}>{ambiance?.message}</Text>
          <Text style={styles.emojis}>{ambiance?.emojis.join(" ")}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={onFermer}
            style={styles.bouton}
          >
            <Text style={styles.boutonTexte}>Fermer</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fond: {
    alignItems: "center",
    backgroundColor: "rgba(24, 15, 5, 0.58)",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  carte: {
    alignItems: "center",
    backgroundColor: "#FFF8E7",
    borderColor: "#E8B34B",
    borderRadius: 28,
    borderWidth: 2,
    maxWidth: 480,
    padding: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    width: "100%",
  },
  empereur: {
    height: 150,
    marginBottom: 8,
    width: 150,
  },
  titre: {
    color: "#6D3B08",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },
  prenom: {
    color: "#B35416",
    fontSize: 31,
    fontWeight: "900",
    marginTop: 8,
  },
  meta: {
    color: "#765D47",
    fontSize: 16,
    marginTop: 3,
  },
  message: {
    color: "#3E2B1C",
    fontSize: 20,
    lineHeight: 28,
    marginTop: 18,
    textAlign: "center",
  },
  emojis: {
    fontSize: 27,
    marginTop: 12,
  },
  bouton: {
    backgroundColor: "#A74612",
    borderRadius: 18,
    marginTop: 22,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  boutonTexte: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
