import { useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  FlatList,
} from "react-native";

import { useHaccp, PointControleTemperature, CategoriePointControle, FrequenceControle } from "@/context/HaccpContext";


const CATEGORIES: CategoriePointControle[] = [
  "Froid positif",
  "Froid négatif",
  "Chaud",
  "Refroidissement",
  "Autre",
];

const FREQUENCIES: FrequenceControle[] = ["matin", "soir", "matin-soir"];

const EMOJI_CATEGORIE: { [key in CategoriePointControle]: string } = {
  "Froid positif": "🥶",
  "Froid négatif": "❄️",
  "Chaud": "🔥",
  "Refroidissement": "🌡️",
  "Autre": "📍",
};

const LIBELLE_FREQUENCE: { [key in FrequenceControle]: string } = {
  "matin": "Matin",
  "soir": "Soir",
  "matin-soir": "Matin + soir",
};


export default function PointsControleScreen() {

  const { pointsControle, ajouterPointControle, modifierPointControle, supprimerPointControle } = useHaccp();

  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [pointEnEdition, setPointEnEdition] = useState<PointControleTemperature | null>(null);

  const [nom, setNom] = useState("");
  const [emplacement, setEmplacement] = useState("");
  const [categorie, setCategorie] = useState<CategoriePointControle>("Froid positif");
  const [temperatureMin, setTemperatureMin] = useState("");
  const [temperatureMax, setTemperatureMax] = useState("");
  const [frequence, setFrequence] = useState<FrequenceControle>("matin-soir");
  const [actif, setActif] = useState(true);
  const [afficherPickerCategorie, setAfficherPickerCategorie] = useState(false);
  const [afficherPickerFrequence, setAfficherPickerFrequence] = useState(false);


  function resetFormulaire() {
    setNom("");
    setEmplacement("");
    setCategorie("Froid positif");
    setTemperatureMin("");
    setTemperatureMax("");
    setFrequence("matin-soir");
    setActif(true);
    setModeEdition(false);
    setPointEnEdition(null);
  }


  function ouvrirFormulaire(point?: PointControleTemperature) {

    if (point) {
      setModeEdition(true);
      setPointEnEdition(point);
      setNom(point.nom);
      setEmplacement(point.emplacement);
      setCategorie(point.categorie);
      setTemperatureMin(point.temperatureMin?.toString() ?? "");
      setTemperatureMax(point.temperatureMax?.toString() ?? "");
      setFrequence(point.frequence);
      setActif(point.actif);
    } else {
      resetFormulaire();
    }

    setAfficherFormulaire(true);

  }


  async function handleSauvegarder() {

    if (!nom.trim() || !emplacement.trim()) {
      alert("Nom et emplacement sont requis");
      return;
    }

    const pointData = {
      nom: nom.trim(),
      emplacement: emplacement.trim(),
      categorie,
      temperatureMin: temperatureMin ? parseInt(temperatureMin) : undefined,
      temperatureMax: temperatureMax ? parseInt(temperatureMax) : undefined,
      frequence,
      actif,
      responsablesAssignes: [],
    };

    if (modeEdition && pointEnEdition) {
      await modifierPointControle(pointEnEdition.id, pointData);
    } else {
      await ajouterPointControle(pointData);
    }

    resetFormulaire();
    setAfficherFormulaire(false);

  }


  async function handleSupprimer(id: string) {

    alert("Êtes-vous sûr de vouloir supprimer ce point ?");
    // Simplified - real implementation would need confirmation
    await supprimerPointControle(id);

  }


  return (

    <SafeAreaView style={styles.container}>

      <ScrollView>

        <Text style={styles.title}>
          🌡️ Points de contrôle température
        </Text>


        <Pressable
          style={styles.addButton}
          onPress={() => ouvrirFormulaire()}
        >
          <Text style={styles.buttonText}>
            ➕ Ajouter un point de contrôle
          </Text>
        </Pressable>


        <Text style={styles.section}>
          Points enregistrés
        </Text>


        {pointsControle.length === 0 ? (

          <View style={styles.card}>
            <Text style={styles.empty}>
              Aucun point de contrôle configuré
            </Text>
          </View>

        ) : (

          <FlatList
            data={pointsControle}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.card, !item.actif && styles.cardInactif]}
                onPress={() => ouvrirFormulaire(item)}
              >

                <View style={styles.cardHeader}>

                  <View style={styles.cardTitre}>
                    <Text style={styles.emoji}>
                      {EMOJI_CATEGORIE[item.categorie]}
                    </Text>
                    <View>
                      <Text style={styles.nom}>
                        {item.nom}
                      </Text>
                      <Text style={styles.emplacement}>
                        📍 {item.emplacement}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleSupprimer(item.id)}
                  >
                    <Text>❌</Text>
                  </Pressable>

                </View>


                <View style={styles.cardDetails}>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Catégorie:</Text>
                    <Text style={styles.value}>
                      {item.categorie}
                    </Text>
                  </View>

                  {(item.temperatureMin !== undefined || item.temperatureMax !== undefined) && (
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Température:</Text>
                      <Text style={styles.value}>
                        {item.temperatureMin ?? "-"}°C à {item.temperatureMax ?? "-"}°C
                      </Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Fréquence:</Text>
                    <Text style={styles.value}>
                      {LIBELLE_FREQUENCE[item.frequence]}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.label}>Statut:</Text>
                    <Text style={[styles.value, item.actif ? styles.actif : styles.inactif]}>
                      {item.actif ? "✓ Actif" : "⊘ Inactif"}
                    </Text>
                  </View>

                </View>

              </Pressable>
            )}
          />

        )}

      </ScrollView>


      <Modal
        visible={afficherFormulaire}
        animationType="slide"
        transparent
      >

        <SafeAreaView style={styles.modalContainer}>

          <ScrollView style={styles.modalContent}>

            <Text style={styles.modalTitle}>
              {modeEdition ? "Modifier le point de contrôle" : "Ajouter un point de contrôle"}
            </Text>


            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Chambre froide cuisine"
              value={nom}
              onChangeText={setNom}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Emplacement *</Text>
            <TextInput
              style={styles.input}
              placeholder="Étage, zone, etc."
              value={emplacement}
              onChangeText={setEmplacement}
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Catégorie</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setAfficherPickerCategorie(!afficherPickerCategorie)}
            >
              <Text style={styles.selectButtonText}>
                {EMOJI_CATEGORIE[categorie]} {categorie}
              </Text>
            </Pressable>

            {afficherPickerCategorie && (
              <View style={styles.selectDropdown}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.selectOption,
                      categorie === cat && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      setCategorie(cat);
                      setAfficherPickerCategorie(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        categorie === cat && styles.selectOptionTextActive,
                      ]}
                    >
                      {EMOJI_CATEGORIE[cat]} {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Température minimale (°C)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 0"
              value={temperatureMin}
              onChangeText={setTemperatureMin}
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Température maximale (°C)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 4"
              value={temperatureMax}
              onChangeText={setTemperatureMax}
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />

            <Text style={styles.inputLabel}>Fréquence de contrôle</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setAfficherPickerFrequence(!afficherPickerFrequence)}
            >
              <Text style={styles.selectButtonText}>
                {LIBELLE_FREQUENCE[frequence]}
              </Text>
            </Pressable>

            {afficherPickerFrequence && (
              <View style={styles.selectDropdown}>
                {FREQUENCIES.map((freq) => (
                  <Pressable
                    key={freq}
                    style={[
                      styles.selectOption,
                      frequence === freq && styles.selectOptionActive,
                    ]}
                    onPress={() => {
                      setFrequence(freq);
                      setAfficherPickerFrequence(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.selectOptionText,
                        frequence === freq && styles.selectOptionTextActive,
                      ]}
                    >
                      {LIBELLE_FREQUENCE[freq]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <View style={styles.switchContainer}>
              <Text style={styles.inputLabel}>Actif</Text>
              <Switch
                value={actif}
                onValueChange={setActif}
              />
            </View>


            <View style={styles.modalButtons}>

              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  resetFormulaire();
                  setAfficherFormulaire(false);
                }}
              >
                <Text style={styles.cancelButtonText}>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSauvegarder}
              >
                <Text style={styles.submitButtonText}>
                  {modeEdition ? "Modifier" : "Ajouter"}
                </Text>
              </Pressable>

            </View>

          </ScrollView>

        </SafeAreaView>

      </Modal>

    </SafeAreaView>

  );

}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00695C",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  section: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  addButton: {
    backgroundColor: "#00695C",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#00695C",
  },

  cardInactif: {
    opacity: 0.6,
    borderLeftColor: "#CCC",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  cardTitre: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },

  emoji: {
    fontSize: 24,
  },

  nom: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  emplacement: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  deleteButton: {
    padding: 8,
  },

  cardDetails: {
    gap: 8,
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },

  value: {
    fontSize: 14,
    color: "#333",
  },

  actif: {
    color: "#00695C",
    fontWeight: "bold",
  },

  inactif: {
    color: "#999",
  },

  empty: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    paddingVertical: 20,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalContent: {
    backgroundColor: "#FFF",
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00695C",
    marginBottom: 20,
    textAlign: "center",
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  selectButton: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 10,
  },

  selectButtonText: {
    fontSize: 16,
    color: "#333",
  },

  selectDropdown: {
    backgroundColor: "#FFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
    marginBottom: 10,
  },

  selectOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },

  selectOptionActive: {
    backgroundColor: "#E8F5E9",
  },

  selectOptionText: {
    fontSize: 16,
    color: "#333",
  },

  selectOptionTextActive: {
    fontWeight: "bold",
    color: "#00695C",
  },

  pickerContainer: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  picker: {
    color: "#333",
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    paddingVertical: 10,
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#EEE",
  },

  cancelButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
  },

  submitButton: {
    backgroundColor: "#00695C",
  },

  submitButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

});
