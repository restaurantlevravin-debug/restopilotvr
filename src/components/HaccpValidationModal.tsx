import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";

type HaccpValidationModalProps = {
  visible: boolean;
  temperature: string;
  date: string;
  heure: string;
  responsable: string;
  conforme: boolean;
  points: number;
  dansCreneau: boolean;
  heurePrevue: string;
  photoUri?: string;
  onClose: () => void;
};

export function HaccpValidationModal({
  visible,
  temperature,
  date,
  heure,
  responsable,
  conforme,
  points,
  dansCreneau,
  heurePrevue,
  photoUri,
  onClose,
}: HaccpValidationModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modal, !conforme && styles.modalAlert]}>
          <Text style={[styles.title, !conforme && styles.titleAlert]}>{conforme ? "✅ HACCP enregistré" : "⚠️ Température non conforme"}</Text>
          {!conforme && <Text style={styles.alertMessage}>Une action corrective est nécessaire.</Text>}
          <Text style={styles.line}>Température enregistrée : {temperature}</Text>
          <Text style={styles.line}>Date et heure : {date} à {heure}</Text>
          <Text style={styles.line}>Responsable : {responsable}</Text>
          <Text style={[styles.schedule, dansCreneau ? styles.scheduleOk : styles.scheduleKo]}>
            {dansCreneau ? "✅ Dans le créneau HACCP" : "⏱️ Hors créneau"} ({heurePrevue})
          </Text>
          <Text style={[styles.points, !conforme && styles.pointsAlert]}>🏆 +{points} points qualité</Text>
          {photoUri ? (
            <View style={styles.photoBlock}>
              <Text style={styles.line}>📷 Photo jointe</Text>
              <Image source={{ uri: photoUri }} style={styles.photo} accessibilityLabel="Photo HACCP jointe" />
            </View>
          ) : null}
          <Pressable style={[styles.button, !conforme && styles.alertButton]} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "rgba(0, 0, 0, 0.45)" },
  modal: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 22, borderTopWidth: 6, borderTopColor: "#00695C" },
  modalAlert: { borderTopColor: "#B3261E" },
  title: { color: "#00695C", fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  titleAlert: { color: "#B3261E" },
  alertMessage: { color: "#B3261E", fontWeight: "bold", marginBottom: 12 },
  line: { color: "#444444", marginBottom: 7, fontSize: 16 },
  points: { color: "#00695C", fontSize: 18, fontWeight: "bold", marginTop: 5 },
  pointsAlert: { color: "#B3261E" },
  schedule: { fontWeight: "bold", marginTop: 4 },
  scheduleOk: { color: "#00695C" },
  scheduleKo: { color: "#B05A3C" },
  photoBlock: { marginTop: 4 },
  photo: { width: 120, height: 120, borderRadius: 10, marginTop: 2, marginBottom: 12, backgroundColor: "#EEEEEE" },
  button: { backgroundColor: "#00695C", padding: 14, borderRadius: 10, marginTop: 10 },
  alertButton: { backgroundColor: "#B3261E" },
  buttonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16, textAlign: "center" },
});
