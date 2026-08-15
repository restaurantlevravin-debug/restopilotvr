import { useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { useHaccp, PointControleTemperature } from "@/context/HaccpContext";
import { useEntreprise } from "@/context/EntrepriseContext";

type ControlePoint = {
  point: PointControleTemperature;
  temperature: string;
  conforme: boolean | null;
  motif: string;
  actionCorrective: string;
  photo: string;
  responsable: string;
  complete: boolean;
};


export default function ControleduJourScreen() {

  const { pointsControle, ajouterReleve } = useHaccp();
  const { entrepriseActive } = useEntreprise();

  const pointsActifs = pointsControle.filter((p) => p.actif);

  const [controles, setControles] = useState<ControlePoint[]>(
    pointsActifs.map((point) => ({
      point,
      temperature: "",
      conforme: null,
      motif: "",
      actionCorrective: "",
      photo: "",
      responsable: "",
      complete: false,
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [afficherResume, setAfficherResume] = useState(false);

  const currentControle = controles[currentIndex];
  const controlesCmpletes = controles.filter((c) => c.complete).length;
  const conformes = controles.filter((c) => c.complete && c.conforme).length;
  const anomalies = controles.filter((c) => c.complete && !c.conforme).length;
  const tousTermines = controlesCmpletes === controles.length;


  function verifierConformite(temperature: string): boolean {
    if (!temperature.trim() || !currentControle) return false;

    const temp = parseFloat(temperature);
    if (isNaN(temp)) return false;

    const point = currentControle.point;

    if (point.temperatureMin !== undefined && temp < point.temperatureMin) {
      return false;
    }
    if (point.temperatureMax !== undefined && temp > point.temperatureMax) {
      return false;
    }

    return true;
  }


  function handleTemperatureChange(value: string) {

    const conforme = value.trim() ? verifierConformite(value) : null;

    setControles([
      ...controles.slice(0, currentIndex),
      {
        ...currentControle,
        temperature: value,
        conforme,
      },
      ...controles.slice(currentIndex + 1),
    ]);

  }


  async function handlePrendrePhoto() {

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Autorisation refusée", "Caméra nécessaire pour la photo.");
      return;
    }

    const resultat = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (!resultat.canceled) {
      setControles([
        ...controles.slice(0, currentIndex),
        {
          ...currentControle,
          photo: resultat.assets[0].uri,
        },
        ...controles.slice(currentIndex + 1),
      ]);
    }

  }


  function handleMotifChange(value: string) {

    setControles([
      ...controles.slice(0, currentIndex),
      {
        ...currentControle,
        motif: value,
      },
      ...controles.slice(currentIndex + 1),
    ]);

  }


  function handleActionChange(value: string) {

    setControles([
      ...controles.slice(0, currentIndex),
      {
        ...currentControle,
        actionCorrective: value,
      },
      ...controles.slice(currentIndex + 1),
    ]);

  }


  function handleResponsableChange(value: string) {

    setControles([
      ...controles.slice(0, currentIndex),
      {
        ...currentControle,
        responsable: value,
      },
      ...controles.slice(currentIndex + 1),
    ]);

  }


  function validerControle() {

    if (!currentControle.temperature.trim()) {
      Alert.alert("Champ manquant", "Indiquez la température.");
      return;
    }

    if (!currentControle.responsable.trim()) {
      Alert.alert("Champ manquant", "Indiquez le responsable.");
      return;
    }

    if (!currentControle.conforme && (!currentControle.motif.trim() || !currentControle.actionCorrective.trim() || !currentControle.photo)) {
      Alert.alert(
        "Anomalie incomplète",
        "Photo, motif et action corrective sont obligatoires."
      );
      return;
    }

    setControles([
      ...controles.slice(0, currentIndex),
      {
        ...currentControle,
        complete: true,
      },
      ...controles.slice(currentIndex + 1),
    ]);

    if (currentIndex < controles.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setAfficherResume(true);
    }

  }


  async function enregistrerControles() {

    try {

      for (const controle of controles) {

        if (!controle.complete) continue;

        const maintenant = new Date();
        const dateReelle = maintenant.toLocaleDateString("fr-FR");
        const heureReelle = maintenant.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        await ajouterReleve({
          pointControleId: controle.point.id,
          periode: "matin",
          date: dateReelle,
          heure: heureReelle,
          temperature: controle.temperature,
          responsable: controle.responsable,
          conforme: controle.conforme ?? false,
          photo: !controle.conforme ? controle.photo : undefined,
          commentaireAnomalie: !controle.conforme ? controle.motif : undefined,
          actionCorrective: !controle.conforme ? controle.actionCorrective : undefined,
          anomalieTraitee: !controle.conforme,
          dansCreneau: true,
          heurePrevue: "08:00",
        });

      }

      Alert.alert("Succès", "Tous les contrôles ont été enregistrés.");
      router.push("/haccp");

    } catch (error) {

      Alert.alert("Erreur", "Impossible d'enregistrer les contrôles.");
      console.error(error);

    }

  }


  if (pointsActifs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>🌡️ Contrôle HACCP du jour</Text>
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              Aucun point de contrôle configuré pour {entrepriseActive?.nom ?? "cette entreprise"}.
            </Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.push("/haccp/points-controle")}
            >
              <Text style={styles.buttonText}>
                ⚙️ Configurer les points
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (afficherResume) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resumeContent}>

          <Text style={styles.title}>✅ Contrôle HACCP terminé</Text>

          <View style={styles.card}>

            <Text style={styles.resumeTitle}>Résumé du contrôle</Text>

            <View style={styles.resumeRow}>
              <Text style={styles.resumeLabel}>Points contrôlés:</Text>
              <Text style={styles.resumeValue}>{controlesCmpletes}</Text>
            </View>

            <View style={styles.resumeRow}>
              <Text style={styles.resumeLabel}>✅ Conformes:</Text>
              <Text style={[styles.resumeValue, styles.conforme]}>
                {conformes}
              </Text>
            </View>

            <View style={styles.resumeRow}>
              <Text style={styles.resumeLabel}>❌ Anomalies:</Text>
              <Text style={[styles.resumeValue, styles.nonConforme]}>
                {anomalies}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Taux de conformité</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(conformes / controlesCmpletes) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((conformes / controlesCmpletes) * 100)}%
              </Text>
            </View>

          </View>

          <View style={styles.card}>

            <Text style={styles.resumeTitle}>Points contrôlés</Text>

            {controles.map((controle, index) => (
              <View key={controle.point.id} style={styles.pointSummary}>

                <View style={styles.pointSummaryHeader}>
                  <Text style={styles.pointSummaryName}>
                    {controle.conforme ? "✅" : "❌"} {controle.point.nom}
                  </Text>
                  <Text style={styles.pointSummaryTemp}>
                    {controle.temperature}°C
                  </Text>
                </View>

                <Text style={styles.pointSummaryDetail}>
                  Plage: {controle.point.temperatureMin ?? "-"}°C à{" "}
                  {controle.point.temperatureMax ?? "-"}°C
                </Text>

                {!controle.conforme && (
                  <View style={styles.anomalyBox}>
                    <Text style={styles.anomalyLabel}>Motif:</Text>
                    <Text style={styles.anomalyText}>{controle.motif}</Text>
                    <Text style={styles.anomalyLabel}>Action:</Text>
                    <Text style={styles.anomalyText}>
                      {controle.actionCorrective}
                    </Text>
                  </View>
                )}

              </View>
            ))}

          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={enregistrerControles}
          >
            <Text style={styles.buttonText}>💾 Enregistrer les contrôles</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setAfficherResume(false);
              setCurrentIndex(0);
              setControles(
                pointsActifs.map((point) => ({
                  point,
                  temperature: "",
                  conforme: null,
                  motif: "",
                  actionCorrective: "",
                  photo: "",
                  responsable: "",
                  complete: false,
                }))
              );
            }}
          >
            <Text style={styles.buttonText}>🔄 Recommencer</Text>
          </Pressable>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      <ScrollView contentContainerStyle={styles.content}>

        <Text style={styles.title}>🌡️ Contrôle HACCP du jour</Text>

        <Text style={styles.subtitle}>{entrepriseActive?.nom}</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Contrôles effectués: {controlesCmpletes} / {controles.length}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(controlesCmpletes / controles.length) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.card}>

          <Text style={styles.pointTitle}>
            {currentControle.point.nom}
          </Text>

          <Text style={styles.pointDetail}>
            📍 {currentControle.point.emplacement}
          </Text>

          <Text style={styles.pointDetail}>
            📂 {currentControle.point.categorie}
          </Text>

          <Text style={styles.pointDetail}>
            🌡️ Plage acceptable: {currentControle.point.temperatureMin ?? "-"}°C à{" "}
            {currentControle.point.temperatureMax ?? "-"}°C
          </Text>

          <View style={styles.divider} />

          <Text style={styles.formLabel}>Température relevée *</Text>
          <TextInput
            style={styles.inputLarge}
            value={currentControle.temperature}
            onChangeText={handleTemperatureChange}
            placeholder="Ex: 3"
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />

          {currentControle.temperature && (
            <View
              style={[
                styles.conformityBox,
                currentControle.conforme
                  ? styles.conformBox
                  : styles.nonConformBox,
              ]}
            >
              <Text style={styles.conformityText}>
                {currentControle.conforme ? "✅ Conforme" : "⚠️ Anomalie détectée"}
              </Text>
            </View>
          )}

          {!currentControle.conforme && currentControle.temperature && (
            <View style={styles.anomalySection}>

              <Text style={styles.anomalySectionTitle}>
                ⚠️ Détails obligatoires pour l'anomalie
              </Text>

              <Text style={styles.formLabel}>Motif de l'anomalie *</Text>
              <TextInput
                style={styles.input}
                value={currentControle.motif}
                onChangeText={handleMotifChange}
                placeholder="Ex: Porte restée ouverte"
                multiline
                placeholderTextColor="#999"
              />

              <Text style={styles.formLabel}>Action corrective *</Text>
              <TextInput
                style={styles.input}
                value={currentControle.actionCorrective}
                onChangeText={handleActionChange}
                placeholder="Ex: Porte fermée et vérifiée"
                multiline
                placeholderTextColor="#999"
              />

              <Text style={styles.formLabel}>
                Photo de preuve * {currentControle.photo ? "✅" : "❌"}
              </Text>
              <Pressable
                style={styles.cameraButton}
                onPress={handlePrendrePhoto}
              >
                <Text style={styles.buttonText}>
                  📷 {currentControle.photo ? "Changer la photo" : "Prendre une photo"}
                </Text>
              </Pressable>

            </View>
          )}

          <Text style={styles.formLabel}>Responsable du contrôle *</Text>
          <TextInput
            style={styles.input}
            value={currentControle.responsable}
            onChangeText={handleResponsableChange}
            placeholder="Nom du responsable"
            placeholderTextColor="#999"
          />

          <Pressable
            style={[
              styles.primaryButton,
              (!currentControle.temperature ||
                !currentControle.responsable ||
                (!currentControle.conforme &&
                  (!currentControle.motif ||
                    !currentControle.actionCorrective ||
                    !currentControle.photo))) &&
                styles.buttonDisabled,
            ]}
            onPress={validerControle}
            disabled={
              !currentControle.temperature ||
              !currentControle.responsable ||
              (!currentControle.conforme &&
                (!currentControle.motif ||
                  !currentControle.actionCorrective ||
                  !currentControle.photo))
            }
          >
            <Text style={styles.buttonText}>
              ✓ Valider ce contrôle
            </Text>
          </Pressable>

        </View>

        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Points à contrôler</Text>
          {controles.map((controle, index) => (
            <View
              key={controle.point.id}
              style={[
                styles.legendItem,
                currentIndex === index && styles.legendItemCurrent,
                controle.complete && styles.legendItemComplete,
              ]}
            >
              <Text style={styles.legendItemText}>
                {controle.complete
                  ? "✅"
                  : currentIndex === index
                    ? "📍"
                    : "☐"}{" "}
                {controle.point.nom}
              </Text>
              {controle.complete && (
                <Text
                  style={[
                    styles.legendItemStatus,
                    controle.conforme
                      ? styles.legendConform
                      : styles.legendNonConform,
                  ]}
                >
                  {controle.conforme ? "✅" : "❌"}
                </Text>
              )}
            </View>
          ))}
        </View>

      </ScrollView>

    </SafeAreaView>
  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  resumeContent: {
    padding: 20,
    paddingBottom: 40,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00695C",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#00695C",
  },

  pointTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00695C",
    marginBottom: 12,
  },

  pointDetail: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    lineHeight: 20,
  },

  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 16,
  },

  formLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  inputLarge: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "bold",
    borderWidth: 2,
    borderColor: "#00695C",
  },

  conformityBox: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 2,
  },

  conformBox: {
    backgroundColor: "#E8F5E9",
    borderColor: "#00695C",
  },

  nonConformBox: {
    backgroundColor: "#FFF3E0",
    borderColor: "#F57C00",
  },

  conformityText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },

  anomalySection: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F57C00",
  },

  anomalySectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#D84315",
    marginBottom: 12,
  },

  cameraButton: {
    backgroundColor: "#D84315",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  primaryButton: {
    backgroundColor: "#00695C",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },

  secondaryButton: {
    backgroundColor: "#B08D57",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  progressContainer: {
    marginBottom: 20,
  },

  progressLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },

  progressBar: {
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 6,
    overflow: "hidden",
  },

  progressFill: {
    height: 12,
    backgroundColor: "#00695C",
  },

  progressText: {
    fontSize: 14,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "bold",
  },

  legendCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#B08D57",
  },

  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },

  legendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: "#F9F9F9",
  },

  legendItemCurrent: {
    backgroundColor: "#E8F3F1",
    borderLeftWidth: 3,
    borderLeftColor: "#00695C",
  },

  legendItemComplete: {
    backgroundColor: "#F1F9F8",
  },

  legendItemText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },

  legendItemStatus: {
    fontSize: 16,
    fontWeight: "bold",
  },

  legendConform: {
    color: "#00695C",
  },

  legendNonConform: {
    color: "#D84315",
  },

  resumeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00695C",
    marginBottom: 16,
  },

  resumeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },

  resumeLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  resumeValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  conforme: {
    color: "#00695C",
  },

  nonConforme: {
    color: "#D84315",
  },

  pointSummary: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#B08D57",
  },

  pointSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  pointSummaryName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },

  pointSummaryTemp: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00695C",
  },

  pointSummaryDetail: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },

  anomalyBox: {
    backgroundColor: "#FFF",
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#F57C00",
  },

  anomalyLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#D84315",
    marginTop: 4,
  },

  anomalyText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },

});
