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
import { useUser } from "@/context/UserContext";

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
    pointsControle,
    ajouterReleve,
    ajouterTrace,
    ajouterAction,
    configurerNotifications,
  } = useHaccp();
  const { utilisateurActif } = useUser();

  const [afficherReleve, setAfficherReleve] = useState(false);
  const [afficherTrace, setAfficherTrace] = useState(false);
  const [afficherAction, setAfficherAction] = useState(false);
  const [validationHaccp, setValidationHaccp] = useState<ValidationHaccp | null>(null);
  const [recompenseHaccp, setRecompenseHaccp] = useState<RecompenseHaccp | null>(null);

  const [pointControleId, setPointControleId] = useState<string | null>(null);
  const [afficherSelecteurPoint, setAfficherSelecteurPoint] = useState(false);
  const [periode, setPeriode] = useState<"matin" | "soir">("matin");
  const [temperature, setTemperature] = useState("");
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
  const [dateAction, setDateAction] = useState(valeurInitialeDate());
  const [resolution, setResolution] = useState("");

  const [rappelsActifs, setRappelsActifs] = useState(notifications.active);

  useEffect(() => {
    setRappelsActifs(notifications.active);
  }, [notifications]);

  async function enregistrerReleve() {
    if (!pointControleId) {
      Alert.alert("Sélection manquante", "Choisissez un point de contrôle.");
      return;
    }

    if (!temperature.trim() || !utilisateurActif) {
      Alert.alert("Identification requise", "Sélectionnez un profil utilisateur.");
      return;
    }

    // Vérifier la conformité basée sur le point de contrôle
    const pointControle = pointsControle.find((p) => p.id === pointControleId);
    const tempNumerique = parseFloat(temperature);
    let conformeCalcule = true;

    if (pointControle && !isNaN(tempNumerique)) {
      if (pointControle.temperatureMin !== undefined && tempNumerique < pointControle.temperatureMin) {
        conformeCalcule = false;
      }
      if (pointControle.temperatureMax !== undefined && tempNumerique > pointControle.temperatureMax) {
        conformeCalcule = false;
      }
    }

    // Forcer la valeur calculée
    setConforme(conformeCalcule);

    // Si anomalie, tous les champs sont obligatoires
    if (!conformeCalcule && (!photoPreuveReleve || !commentaireAnomalie.trim() || !actionAnomalie.trim())) {
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
    const anomalieTraitee = !conformeCalcule && Boolean(photoPreuveReleve && commentaireAnomalie.trim() && actionAnomalie.trim());
    const pointsValidation = calculerPointsReleve({ conforme: conformeCalcule, photo: photoPreuveReleve || undefined, anomalieTraitee });
    const progression = calculerProgressionHaccp(scoreHaccp, conformeCalcule, !conformeCalcule && Boolean(photoPreuveReleve), pointsValidation);

    await ajouterReleve({
      pointControleId,
      periode,
      date: dateReelle,
      heure: heureReelle,
      temperature,
      responsable: utilisateurActif.nom,
      conforme: conformeCalcule,
      photo: !conformeCalcule ? photoPreuveReleve : undefined,
      commentaireAnomalie: !conformeCalcule ? commentaireAnomalie.trim() : undefined,
      actionCorrective: !conformeCalcule ? actionAnomalie.trim() : undefined,
      anomalieTraitee,
      ...statutCreneau,
    });

    if (!conformeCalcule) {
      await ajouterAction({
        probleme: `Température non conforme sur ${pointControle?.nom ?? "équipement"} : ${temperature}°C (plage: ${pointControle?.temperatureMin ?? "-"}°C à ${pointControle?.temperatureMax ?? "-"}°C).`,
        action: actionAnomalie.trim(),
        responsable: utilisateurActif.nom,
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
      responsable: utilisateurActif.nom,
      conforme: conformeCalcule,
      points: pointsValidation,
      photoUri: photoPreuveReleve || undefined,
      ...statutCreneau,
    });

    if (conformeCalcule && progression.recompenseDebloquee) {
      setRecompenseHaccp({
        grade: progression.recompenseDebloquee,
        pointsGagnes: progression.pointsRecompense,
      });
    }

    setTemperature("");
    setPhotoPreuveReleve("");
    setCommentaireAnomalie("");
    setActionAnomalie("");
    setPointControleId(null);
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
    if (!probleme.trim() || !action.trim() || !utilisateurActif) {
      Alert.alert("Identification requise", "Sélectionnez un profil utilisateur.");
      return;
    }

    await ajouterAction({
      probleme,
      action,
      responsable: utilisateurActif.nom,
      date: dateAction,
      resolution,
    });

    setProbleme("");
    setAction("");
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

      <Pressable
        style={styles.quickAccessButton}
        onPress={() => router.push("/haccp/mes-controles")}
      >
        <Text style={styles.quickAccessText}>⚡ Mes contrôles du jour (Rapide)</Text>
      </Pressable>

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
            <Text style={styles.formLabel}>Point de contrôle *</Text>
            {pointControleId ? (
              <View>
                <Pressable
                  style={styles.selectedPointButton}
                  onPress={() => setAfficherSelecteurPoint(!afficherSelecteurPoint)}
                >
                  <Text style={styles.selectedPointText}>
                    {pointsControle.find((p) => p.id === pointControleId)?.nom ?? "Point sélectionné"}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </Pressable>
                {afficherSelecteurPoint && (
                  <View style={styles.dropdown}>
                    {pointsControle.map((point) => (
                      <Pressable
                        key={point.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setPointControleId(point.id);
                          setAfficherSelecteurPoint(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {point.nom} ({point.emplacement})
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <Pressable
                style={styles.selectPointButton}
                onPress={() => setAfficherSelecteurPoint(!afficherSelecteurPoint)}
              >
                <Text style={styles.selectPointText}>Sélectionner un point...</Text>
              </Pressable>
            )}
            {afficherSelecteurPoint && !pointControleId && (
              <View style={styles.dropdown}>
                {pointsControle.length === 0 ? (
                  <Text style={styles.noPointsText}>Aucun point de contrôle configuré</Text>
                ) : (
                  pointsControle.map((point) => (
                    <Pressable
                      key={point.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setPointControleId(point.id);
                        setAfficherSelecteurPoint(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {point.nom} ({point.emplacement})
                      </Text>
                      <Text style={styles.pointTempRange}>
                        {point.temperatureMin ?? "-"}°C à {point.temperatureMax ?? "-"}°C
                      </Text>
                    </Pressable>
                  ))
                )}
              </View>
            )}
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
            <TextInput style={styles.input} value={temperature} onChangeText={setTemperature} placeholder="Température relevée (ex. 3)" />
            <Text style={styles.scheduleInfo}>Effectué par : {utilisateurActif?.nom ?? "Profil non sélectionné"}</Text>
            <Pressable style={[styles.conformityButton, conforme ? styles.conforme : styles.nonConforme]} onPress={() => {}}>
              <Text style={styles.buttonText}>{conforme ? "✅ Conforme" : "❌ Non conforme (automatique)"}</Text>
            </Pressable>
            {!conforme && (
              <View style={styles.anomalyForm}>
                <Text style={styles.anomalyTitle}>⚠️ Température non conforme</Text>
                <Text style={styles.scheduleInfo}>Photo, commentaire et action corrective OBLIGATOIRES.</Text>
                <Pressable style={styles.anomalyButton} onPress={prendrePhotoPreuveReleve}>
                  <Text style={styles.buttonText}>📷 Photographier la preuve {photoPreuveReleve ? "✅" : "❌"}</Text>
                </Pressable>
                {photoPreuveReleve !== "" && <Text style={styles.photoStatus}>✅ Photo de preuve ajoutée (+3 points)</Text>}
                <TextInput
                  style={styles.input}
                  value={commentaireAnomalie}
                  onChangeText={setCommentaireAnomalie}
                  placeholder="Commentaire sur l'anomalie *"
                  multiline
                  placeholderTextColor="#f44336"
                />
                <TextInput
                  style={styles.input}
                  value={actionAnomalie}
                  onChangeText={setActionAnomalie}
                  placeholder="Action corrective réalisée *"
                  multiline
                  placeholderTextColor="#f44336"
                />
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
            <Text style={styles.scheduleInfo}>Effectué par : {utilisateurActif?.nom ?? "Profil non sélectionné"}</Text>
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
  quickAccessButton: { backgroundColor: "#FF6B35", padding: 16, borderRadius: 12, marginBottom: 20, justifyContent: "center", alignItems: "center" },
  quickAccessText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF", textAlign: "center" },
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
  selectPointButton: { backgroundColor: "#F3F3F3", padding: 13, borderRadius: 10, marginBottom: 12, borderWidth: 2, borderColor: "#00695C" },
  selectPointText: { color: "#00695C", fontWeight: "bold" },
  selectedPointButton: { backgroundColor: "#E8F3F1", padding: 13, borderRadius: 10, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectedPointText: { color: "#00695C", fontWeight: "bold", flex: 1 },
  dropdownArrow: { color: "#00695C", fontSize: 12, fontWeight: "bold" },
  dropdown: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#B08D57", borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  dropdownItemText: { color: "#333333", fontWeight: "bold" },
  pointTempRange: { color: "#666666", fontSize: 12, marginTop: 4 },
  noPointsText: { color: "#999999", padding: 12, textAlign: "center" },
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
