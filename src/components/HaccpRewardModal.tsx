import { useEffect, useRef } from "react";
import { Animated, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import type { GradeHaccp } from "@/context/HaccpContext";

type HaccpRewardModalProps = {
  visible: boolean;
  grade: GradeHaccp;
  pointsGagnes: number;
  onContinue: () => void;
};

const illustrations: Record<GradeHaccp, number> = {
  "PADAWAN HACCP": require("@/../assets/haccp/padawan.png"),
  "MONSTRE HACCP": require("@/../assets/haccp/monstre.png"),
  "EMPEREUR HACCP": require("@/../assets/haccp/empereur.png"),
};

export function obtenirIllustrationGrade(grade: GradeHaccp) {
  return illustrations[grade];
}

function messageGrade(grade: GradeHaccp) {
  if (grade === "MONSTRE HACCP") {
    return "Ta rigueur protège l’empire et ton patron :).";
  }

  if (grade === "EMPEREUR HACCP") {
    return "L'EMPIRE DE LA CONFORMITÉ TE REMERCIE";
  }

  return "Grâce à ta rigueur, tu fais grandir l’Empire de la Conformité.";
}

export function HaccpRewardModal({ visible, grade, pointsGagnes, onContinue }: HaccpRewardModalProps) {
  const apparition = useRef(new Animated.Value(0)).current;
  const lumiere = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      apparition.setValue(0);
      lumiere.setValue(0);
      return;
    }

    const animation = Animated.parallel([
      Animated.timing(apparition, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.loop(Animated.sequence([
        Animated.timing(lumiere, { toValue: 1, duration: 950, useNativeDriver: true }),
        Animated.timing(lumiere, { toValue: 0.25, duration: 950, useNativeDriver: true }),
      ])),
    ]);
    animation.start();

    return () => animation.stop();
  }, [apparition, lumiere, visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onContinue}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.light, { opacity: lumiere }]} />
        <Animated.View style={[styles.card, { opacity: apparition, transform: [{ scale: apparition.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Text style={styles.kicker}>🏆 RÉCOMPENSE DÉBLOQUÉE</Text>
          <Text style={styles.title}>FÉLICITATIONS !</Text>
          <Image source={obtenirIllustrationGrade(grade)} style={styles.character} resizeMode="contain" />
          <Text style={styles.grade}>{grade}</Text>
          <Text style={styles.message}>{messageGrade(grade)}</Text>
          <View style={styles.scoreRow}><View><Text style={styles.scoreLabel}>POINTS DE RÉCOMPENSE</Text><Text style={styles.points}>+{pointsGagnes}</Text></View></View>
          <Pressable style={styles.button} onPress={onContinue}><Text style={styles.buttonText}>Continuer</Text></Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { alignItems: "center", backgroundColor: "rgba(2, 10, 17, 0.93)", flex: 1, justifyContent: "center", padding: 20 },
  light: { backgroundColor: "#D4AF37", borderRadius: 220, height: 360, position: "absolute", width: 360 },
  card: { backgroundColor: "#081A24", borderColor: "#B87333", borderRadius: 24, borderWidth: 2, maxWidth: 430, overflow: "hidden", padding: 20, width: "100%" },
  kicker: { color: "#D4AF37", fontSize: 14, fontWeight: "bold", letterSpacing: 1.2, textAlign: "center" },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "bold", marginTop: 7, textAlign: "center" },
  character: { alignSelf: "center", height: 230, marginVertical: 8, width: 230 },
  grade: { color: "#D4AF37", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  message: { color: "#DDEEF0", fontSize: 16, lineHeight: 22, marginTop: 10, textAlign: "center" },
  scoreRow: { backgroundColor: "#0D2D38", borderRadius: 14, flexDirection: "row", justifyContent: "space-around", marginTop: 18, padding: 12 },
  scoreLabel: { color: "#A7C9CD", fontSize: 10, fontWeight: "bold", textAlign: "center" },
  points: { color: "#D4AF37", fontSize: 24, fontWeight: "bold", marginTop: 3, textAlign: "center" },
  button: { backgroundColor: "#00695C", borderColor: "#D4AF37", borderRadius: 12, borderWidth: 1, marginTop: 18, padding: 14 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});
