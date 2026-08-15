import { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { useHaccp, PointControleTemperature } from "@/context/HaccpContext";
import { useUser } from "@/context/UserContext";
import { useEntreprise } from "@/context/EntrepriseContext";

type ControleSaisi = {
  point: PointControleTemperature;
  temperature: string;
  complete: boolean;
};

export default function MesControlesScreen() {
  const { obtenirMesControles, ajouterReleve, enregistrerControleRealise } = useHaccp();
  const { utilisateurActif } = useUser();
  const { entrepriseActive } = useEntreprise();

  const [controles, setControles] = useState<ControleSaisi[]>([]);
  const [enChargement, setEnChargement] = useState(true);
  const [enRegistrement, setEnRegistrement] = useState(false);

  useEffect(() => {
    const mesControles = obtenirMesControles();
    setControles(
      mesControles.map((point) => ({
        point,
        temperature: "",
        complete: false,
      }))
    );
    setEnChargement(false);
  }, [entrepriseActive?.id, utilisateurActif?.id]);

  const controlesCmpletes = controles.filter((c) => c.complete).length;
  const tousTermines = controlesCmpletes === controles.length && controles.length > 0;

  function verifierConformite(temperature: string, point: PointControleTemperature): boolean {
    if (!temperature.trim()) return false;

    const temp = parseFloat(temperature);
    if (isNaN(temp)) return false;

    if (point.temperatureMin !== undefined && temp < point.temperatureMin) {
      return false;
    }
    if (point.temperatureMax !== undefined && temp > point.temperatureMax) {
      return false;
    }

    return true;
  }

  function handleTemperatureChange(index: number, value: string) {
    const nouveaux = [...controles];
    nouveaux[index].temperature = value;
    setControles(nouveaux);
  }

  async function validerControle(index: number) {
    const controle = controles[index];

    if (!controle.temperature.trim()) {
      Alert.alert("Erreur", "Veuillez renseigner le résultat du contrôle.");
      return;
    }

    const estTemperature = controle.point.typeControle === "TEMPERATURE";
    const temp = parseFloat(controle.temperature);
    if (estTemperature && isNaN(temp)) {
      Alert.alert("Erreur", "La température doit être un nombre.");
      return;
    }

    try {
      const conforme = verifierConformite(controle.temperature, controle.point);
      const maintenant = new Date();
      const dateReelle = maintenant.toLocaleDateString("fr-FR");
      const heureReelle = maintenant.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (estTemperature) {
        await ajouterReleve({
          pointControleId: controle.point.id,
          periode: "matin",
          date: dateReelle,
          heure: heureReelle,
          temperature: controle.temperature,
          responsable: utilisateurActif?.nom ?? "Inconnu",
          conforme,
          dansCreneau: true,
          commentaireAnomalie: !conforme ? "Température hors limites" : undefined,
        });
      } else {
        const enregistre = await enregistrerControleRealise({
          pointControleId: controle.point.id,
          date: dateReelle,
          heure: heureReelle,
          valeur: controle.temperature.trim(),
          conforme: true,
          statutValidation: "CLOS",
        });
        if (!enregistre) throw new Error("Contrôle non autorisé");
      }

      const nouveaux = [...controles];
      nouveaux[index].complete = true;
      setControles(nouveaux);

      Alert.alert("✅ Validé", `${controle.point.nom} validé.`);
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'enregistrer le contrôle.");
      console.error(error);
    }
  }

  async function terminerSession() {
    if (controlesCmpletes === 0) {
      Alert.alert("Erreur", "Veuillez valider au moins un contrôle.");
      return;
    }

    Alert.alert(
      "Confirmation",
      `${controlesCmpletes} contrôle(s) validé(s). Terminer la session ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Terminer",
          onPress: () => {
            // Session terminée
            Alert.alert("Succès", "Tous vos contrôles ont été enregistrés.");
            setControles(
              controles.map((c) => ({ ...c, temperature: "", complete: false }))
            );
          },
        },
      ]
    );
  }

  if (enChargement) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B35" style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (controles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Text style={styles.greeting}>👋 Bonjour {utilisateurActif?.nom ?? "Utilisateur"}</Text>

          <View style={styles.card}>
            <Text style={styles.title}>Mes contrôles du jour</Text>
            <Text style={styles.emptyText}>
              Aucun contrôle ne vous est assigné pour aujourd'hui.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.greeting}>👋 Bonjour {utilisateurActif?.nom ?? "Utilisateur"}</Text>

        <View style={styles.headerCard}>
          <Text style={styles.title}>Mes contrôles du jour</Text>
          <Text style={styles.subtitle}>
            {controlesCmpletes} / {controles.length} validé(s)
          </Text>
        </View>

        {controles.map((controle, index) => (
          <View
            key={controle.point.id}
            style={[
              styles.controleCard,
              controle.complete && styles.controleCardComplete,
            ]}
          >
            <Text style={styles.controleName}>{controle.point.nom}</Text>
            <Text style={styles.controleLieu}>{controle.point.zone}</Text>

            {!controle.complete ? (
              <>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.temperatureInput}
                    placeholder={controle.point.typeControle === "TEMPERATURE" ? "Température" : "Résultat"}
                    keyboardType={controle.point.typeControle === "TEMPERATURE" ? "decimal-pad" : "default"}
                    value={controle.temperature}
                    onChangeText={(value) =>
                      handleTemperatureChange(index, value)
                    }
                    placeholderTextColor="#999"
                  />
                  {controle.point.typeControle === "TEMPERATURE" && <Text style={styles.unit}>°C</Text>}
                </View>

                {controle.point.temperatureMin !== undefined &&
                  controle.point.temperatureMax !== undefined && (
                    <Text style={styles.limites}>
                      Limites : {controle.point.temperatureMin}°C à{" "}
                      {controle.point.temperatureMax}°C
                    </Text>
                  )}

                <Pressable
                  style={styles.validateButton}
                  onPress={() => validerControle(index)}
                  disabled={enRegistrement}
                >
                  <Text style={styles.validateButtonText}>
                    {enRegistrement ? "⏳ Enregistrement..." : "✓ VALIDER"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.completeStatus}>
                <Text style={styles.completeStatusText}>✅ Validé</Text>
                <Text style={styles.completeStatusTime}>
                  {controle.temperature}{controle.point.typeControle === "TEMPERATURE" ? "°C" : ""}
                </Text>
              </View>
            )}
          </View>
        ))}

        {tousTermines && (
          <Pressable
            style={styles.finishButton}
            onPress={terminerSession}
            disabled={enRegistrement}
          >
            <Text style={styles.finishButtonText}>🏁 TERMINER LA SESSION</Text>
          </Pressable>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  headerCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  controleCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  controleCardComplete: {
    borderLeftColor: "#4CAF50",
    opacity: 0.7,
  },
  controleName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  controleLieu: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  temperatureInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  unit: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B35",
  },
  limites: {
    fontSize: 12,
    color: "#FF6B35",
    marginBottom: 12,
    fontStyle: "italic",
  },
  validateButton: {
    backgroundColor: "#FF6B35",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  validateButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  completeStatus: {
    alignItems: "center",
    paddingVertical: 12,
  },
  completeStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  completeStatusTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  finishButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  finishButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  spacer: {
    height: 20,
  },
});
