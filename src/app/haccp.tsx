import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import {
  calculerProgressionHaccp,
  calculerPointsReleve,
  HORAIRE_RELEVE_MATIN,
  HORAIRE_RELEVE_SOIR,
  obtenirStatutCreneau,
  useHaccp,
} from "@/context/HaccpContext";
import { HaccpValidationModal } from "@/components/HaccpValidationModal";
import { HaccpRewardModal } from "@/components/HaccpRewardModal";
import type { GradeHaccp } from "@/context/HaccpContext";

type ValidationHaccp = {
  temperature: string;
  date: string;
  heure: string;
  responsable: string;
  conforme: boolean;
  points: number;
  dansCreneau: boolean;
  heurePrevue: string;
  photoUri?: string;
};

type RecompenseHaccp = {
  grade: GradeHaccp;
  pointsGagnes: number;
};

function valeurInitialeDate() {
  return new Date().toLocaleDateString("fr-FR");
}

export default function Haccp() {
  const {
    notifications,
    scoreHaccp,
    ajouterReleve,
    ajouterTrace,
    ajouterAction,
    configurerNotifications,
  } = useHaccp();

  const [afficherReleve, setAfficherReleve] = useState(false);
  const [afficherTrace, setAfficherTrace] = useState(false);
  const [afficherAction, setAfficherAction] = useState(false);
  const [validationHaccp, setValidationHaccp] = useState<ValidationHaccp | null>(null);
  const [recompenseHaccp, setRecompenseHaccp] = useState<RecompenseHaccp | null>(null);

  const [periode, setPeriode] = useState<"matin" | "soir">("matin");
  const [temperature, setTemperature] = useState("");
  const [responsableReleve, setResponsableReleve] = useState("");
  const [conforme, setConforme] = useState(true);
  const [photoPreuveReleve, setPhotoPreuveReleve] = useState("");
  const [commentaireAnomalie, setCommentaireAnomalie] = useState("");
  const [actionAnomalie, setActionAnomalie] = useState("");

  const [produit, setProduit] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateReception, setDateReception] = useState(valeurInitialeDate());
  const [dlc, setDlc] = useState("");
  const [temperatureReception, setTemperatureReception] = useState("");
  const [lot, setLot] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [photoEtiquette, setPhotoEtiquette] = useState("");

  const [probleme, setProbleme] = useState("");
  const [action, setAction] = useState("");
  const [responsableAction, setResponsableAction] = useState("");
  const [dateAction, setDateAction] = useState(valeurInitialeDate());
  const [resolution, setResolution] = useState("");

  const [rappelsActifs, setRappelsActifs] = useState(notifications.active);

  useEffect(() => {
    setRappelsActifs(notifications.active);
  }, [notifications]);

  async function enregistrerReleve() {
    if (!temperature.trim() || !responsableReleve.trim()) {
      Alert.alert("Champs manquants", "Indiquez la température et le responsable.");
      return;
    }

    if (!conforme && (!photoPreuveReleve || !commentaireAnomalie.trim() || !actionAnomalie.trim())) {
      Alert.alert(
        "Procédure anomalie incomplète",
        "Pour une température non conforme, ajoutez une photo, un commentaire et une action corrective."
      );
      return;
    }

    const maintenant = new Date();
    const dateReelle = maintenant.toLocaleDateString("fr-FR");
    const heureReelle = maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const statutCreneau = obtenirStatutCreneau(periode, maintenant);
    const anomalieTraitee = !conforme && Boolean(photoPreuveReleve && commentaireAnomalie.trim() && actionAnomalie.trim());
    const pointsValidation = calculerPointsReleve({ conforme, photo: photoPreuveReleve || undefined, anomalieTraitee });
    const progression = calculerProgressionHaccp(scoreHaccp, conforme, !conforme && Boolean(photoPreuveReleve), pointsValidation);

    await ajouterReleve({
      periode,
      date: dateReelle,
      heure: heureReelle,
      temperature,
      responsable: responsableReleve,
      conforme,
      photo: !conforme ? photoPreuveReleve : undefined,
      commentaireAnomalie: !conforme ? commentaireAnomalie.trim() : undefined,
      actionCorrective: !conforme ? actionAnomalie.trim() : undefined,
      anomalieTraitee,
      ...statutCreneau,
    });

    if (!conforme) {
      await ajouterAction({
        probleme: `Température non conforme : ${temperature} (${periode}).`,
        action: actionAnomalie.trim(),
        responsable: responsableReleve,
        date: dateReelle,
        resolution: "Action corrective enregistrée",
        commentaire: commentaireAnomalie.trim(),
        photoPreuve: photoPreuveReleve,
      });
    }

    setValidationHaccp({
      temperature,
      date: dateReelle,
      heure: heureReelle,
      responsable: responsableReleve,
      conforme,
      points: pointsValidation,
      photoUri: photoPreuveReleve || undefined,
      ...statutCreneau,
    });

    if (conforme && progression.recompenseDebloquee) {
      setRecompenseHaccp({
        grade: progression.recompenseDebloquee,
        pointsGagnes: progression.pointsRecompense,
      });
    }

    setTemperature("");
    setResponsableReleve("");
    setPhotoPreuveReleve("");
    setCommentaireAnomalie("");
    setActionAnomalie("");
    setAfficherReleve(false);
  }

  async function prendrePhotoEtiquette() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Autorisation refusée",
        "La caméra est nécessaire pour photographier l'étiquette."
      );
      return;
    }

    const resultat = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!resultat.canceled) {
      setPhotoEtiquette(resultat.assets[0].uri);
    }
  }

  async function prendrePhotoPreuveReleve() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Autorisation refusée", "La caméra est nécessaire pour joindre une preuve au relevé.");
      return;
    }

    const resultat = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });

    if (!resultat.canceled) {
      setPhotoPreuveReleve(resultat.assets[0].uri);
    }
  }

  async function enregistrerTrace() {
    if (!produit.trim() || !fournisseur.trim()) {
      Alert.alert("Champs manquants", "Indiquez le produit et le fournisseur.");
      return;
    }

    await ajouterTrace({
      produit,
      fournisseur,
      dateReception,
      dlc,
      temperatureReception,
      lot,
      commentaire,
      photo: photoEtiquette,
    });

    setProduit("");
    setFournisseur("");
    setDlc("");
    setTemperatureReception("");
    setLot("");
    setCommentaire("");
    setPhotoEtiquette("");
    setAfficherTrace(false);
  }

  async function enregistrerAction() {
    if (!probleme.trim() || !action.trim() || !responsableAction.trim()) {
      Alert.alert("Champs manquants", "Indiquez le problème, l'action et le responsable.");
      return;
    }

    await ajouterAction({
      probleme,
      action,
      responsable: responsableAction,
      date: dateAction,
      resolution,
    });

    setProbleme("");
    setAction("");
    setResponsableAction("");
    setResolution("");
    setAfficherAction(false);
  }

  async function enregistrerRappels(active = rappelsActifs) {
    const rappelsProgrammes = await configurerNotifications({
      active,
      matinHeure: HORAIRE_RELEVE_MATIN,
      soirHeure: HORAIRE_RELEVE_SOIR,
    });

    if (active && !rappelsProgrammes) {
      Alert.alert(
        "Rappels non activés",
        "Vérifiez l'autorisation des notifications et le format des horaires (HH:MM)."
      );
      return;
    }

    Alert.alert(
      "Rappels HACCP",
      active ? "Les rappels matin et soir sont programmés." : "Les rappels sont désactivés."
    );
  }

  async function basculerRappels() {
    const prochainEtat = !rappelsActifs;
    setRappelsActifs(prochainEtat);
    await enregistrerRappels(prochainEtat);
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📋 HACCP</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌡️ Relevés températures</Text>
        <Text style={styles.description}>Deux contrôles quotidiens : 08:00 et 18:00. Rappels {notifications.active ? "activés" : "désactivés"}.</Text>
        <Pressable style={styles.secondaryButton} onPress={basculerRappels}>
          <Text style={styles.buttonText}>{rappelsActifs ? "🔕 Désactiver les rappels" : "🔔 Activer les rappels 08:00 / 18:00"}</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => setAfficherReleve(!afficherReleve)}>
          <Text style={styles.buttonText}>➕ Nouveau relevé</Text>
        </Pressable>

        {afficherReleve && (
          <View style={styles.form}>
            <Text style={styles.formLabel}>Période</Text>
            <View style={styles.buttonRow}>
              <Pressable style={[styles.choiceButton, periode === "matin" && styles.choiceActive]} onPress={() => setPeriode("matin")}>
                <Text style={styles.choiceText}>🌅 Matin</Text>
              </Pressable>
              <Pressable style={[styles.choiceButton, periode === "soir" && styles.choiceActive]} onPress={() => setPeriode("soir")}>
                <Text style={styles.choiceText}>🌙 Soir</Text>
              </Pressable>
            </View>
            <Text style={styles.scheduleInfo}>Horaire prévu : {periode === "matin" ? HORAIRE_RELEVE_MATIN : HORAIRE_RELEVE_SOIR}. L'heure réelle est enregistrée automatiquement.</Text>
            <TextInput style={styles.input} value={temperature} onChangeText={setTemperature} placeholder="Température relevée (ex. +3°C)" />
            <TextInput style={styles.input} value={responsableReleve} onChangeText={setResponsableReleve} placeholder="Responsable" />
            <Pressable style={[styles.conformityButton, conforme ? styles.conforme : styles.nonConforme]} onPress={() => setConforme(!conforme)}>
              <Text style={styles.buttonText}>{conforme ? "✅ Conforme" : "❌ Non conforme"}</Text>
            </Pressable>
            {!conforme && (
              <View style={styles.anomalyForm}>
                <Text style={styles.anomalyTitle}>⚠️ Température non conforme</Text>
                <Text style={styles.scheduleInfo}>Photo, commentaire et action corrective obligatoires.</Text>
                <Pressable style={styles.anomalyButton} onPress={prendrePhotoPreuveReleve}>
                  <Text style={styles.buttonText}>📷 Photographier la preuve</Text>
                </Pressable>
                {photoPreuveReleve !== "" && <Text style={styles.photoStatus}>✅ Photo de preuve ajoutée (+3 points)</Text>}
                <TextInput style={styles.input} value={commentaireAnomalie} onChangeText={setCommentaireAnomalie} placeholder="Commentaire sur l'anomalie" multiline />
                <TextInput style={styles.input} value={actionAnomalie} onChangeText={setActionAnomalie} placeholder="Action corrective réalisée" multiline />
              </View>
            )}
            <Pressable style={styles.primaryButton} onPress={enregistrerReleve}>
              <Text style={styles.buttonText}>💾 Enregistrer le relevé</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📦 Nouvelle traçabilité</Text>
        <Pressable style={styles.secondaryButton} onPress={() => setAfficherTrace(!afficherTrace)}>
          <Text style={styles.buttonText}>➕ Ajouter un produit</Text>
        </Pressable>

        {afficherTrace && (
          <View style={styles.form}>
            <TextInput style={styles.input} value={produit} onChangeText={setProduit} placeholder="Produit" />
            <TextInput style={styles.input} value={fournisseur} onChangeText={setFournisseur} placeholder="Fournisseur" />
            <TextInput style={styles.input} value={dateReception} onChangeText={setDateReception} placeholder="Date de réception" />
            <TextInput style={styles.input} value={dlc} onChangeText={setDlc} placeholder="DLC" />
            <TextInput style={styles.input} value={temperatureReception} onChangeText={setTemperatureReception} placeholder="Température réception" />
            <TextInput style={styles.input} value={lot} onChangeText={setLot} placeholder="Lot" />
            <TextInput style={styles.input} value={commentaire} onChangeText={setCommentaire} placeholder="Commentaire" multiline />
            <Pressable style={styles.secondaryButton} onPress={prendrePhotoEtiquette}>
              <Text style={styles.buttonText}>📷 Photographier l'étiquette</Text>
            </Pressable>
            {photoEtiquette !== "" && <Text style={styles.photoStatus}>✅ Étiquette photographiée</Text>}
            <Pressable style={styles.primaryButton} onPress={enregistrerTrace}>
              <Text style={styles.buttonText}>💾 Enregistrer la traçabilité</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 Dossier HACCP</Text>
        <Text style={styles.description}>Consultez tous les relevés, réceptions et actions correctives.</Text>
        <Pressable style={styles.secondaryButton} onPress={() => router.push("/historique-haccp")}>
          <Text style={styles.buttonText}>📋 Ouvrir le dossier HACCP</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/performance-haccp")}>
          <Text style={styles.buttonText}>🏆 Performance HACCP</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚠️ Actions correctives</Text>
        <Pressable style={styles.secondaryButton} onPress={() => setAfficherAction(!afficherAction)}>
          <Text style={styles.buttonText}>➕ Nouvelle action corrective</Text>
        </Pressable>
        {afficherAction && (
          <View style={styles.form}>
            <TextInput style={styles.input} value={probleme} onChangeText={setProbleme} placeholder="Problème constaté" multiline />
            <TextInput style={styles.input} value={action} onChangeText={setAction} placeholder="Action réalisée" multiline />
            <TextInput style={styles.input} value={responsableAction} onChangeText={setResponsableAction} placeholder="Responsable" />
            <TextInput style={styles.input} value={dateAction} onChangeText={setDateAction} placeholder="Date" />
            <TextInput style={styles.input} value={resolution} onChangeText={setResolution} placeholder="Résolution" multiline />
            <Pressable style={styles.primaryButton} onPress={enregistrerAction}>
              <Text style={styles.buttonText}>💾 Enregistrer l'action</Text>
            </Pressable>
          </View>
        )}
      </View>
      </ScrollView>
      <HaccpValidationModal
        visible={validationHaccp !== null}
        temperature={validationHaccp?.temperature ?? ""}
        date={validationHaccp?.date ?? ""}
        heure={validationHaccp?.heure ?? ""}
        responsable={validationHaccp?.responsable ?? ""}
        conforme={validationHaccp?.conforme ?? true}
        points={validationHaccp?.points ?? 0}
        dansCreneau={validationHaccp?.dansCreneau ?? true}
        heurePrevue={validationHaccp?.heurePrevue ?? ""}
        photoUri={validationHaccp?.photoUri}
        onClose={() => setValidationHaccp(null)}
      />
      <HaccpRewardModal
        visible={recompenseHaccp !== null && validationHaccp === null}
        grade={recompenseHaccp?.grade ?? scoreHaccp.grade}
        pointsGagnes={recompenseHaccp?.pointsGagnes ?? 0}
        onClose={() => setRecompenseHaccp(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F3F3" },
  content: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold", color: "#00695C", textAlign: "center", marginVertical: 25 },
  card: { backgroundColor: "#FFFFFF", padding: 18, borderRadius: 15, borderLeftWidth: 6, borderLeftColor: "#B08D57", marginBottom: 18 },
  cardTitle: { fontSize: 21, fontWeight: "bold", color: "#00695C", marginBottom: 8 },
  description: { color: "#555555", marginBottom: 15 },
  buttonRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  primaryButton: { backgroundColor: "#00695C", padding: 14, borderRadius: 10, marginBottom: 12 },
  secondaryButton: { backgroundColor: "#B08D57", padding: 14, borderRadius: 10, marginBottom: 12 },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  form: { marginTop: 4 },
  formLabel: { fontWeight: "bold", marginBottom: 8 },
  input: { backgroundColor: "#F3F3F3", padding: 13, borderRadius: 10, marginBottom: 12 },
  choiceButton: { flex: 1, borderWidth: 1, borderColor: "#B08D57", padding: 12, borderRadius: 10 },
  choiceActive: { backgroundColor: "#E8F3F1" },
  choiceText: { color: "#00695C", fontWeight: "bold", textAlign: "center" },
  conformityButton: { padding: 14, borderRadius: 10, marginBottom: 12 },
  conforme: { backgroundColor: "#00695C" },
  nonConforme: { backgroundColor: "#B08D57" },
  photoStatus: { color: "#00695C", fontWeight: "bold", marginBottom: 12 },
  scheduleInfo: { color: "#555555", marginBottom: 12, lineHeight: 20 },
  anomalyForm: { backgroundColor: "#FFF2EE", borderColor: "#B3261E", borderRadius: 10, borderWidth: 1, marginBottom: 12, padding: 12 },
  anomalyTitle: { color: "#B3261E", fontSize: 17, fontWeight: "bold", marginBottom: 8 },
  anomalyButton: { backgroundColor: "#B3261E", borderRadius: 10, marginBottom: 12, padding: 14 },
});
