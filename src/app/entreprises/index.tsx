import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";

import { useEntreprise, Entreprise } from "@/context/EntrepriseContext";


const DONNEES_TEST = [
  { nom: "VR à Vin", adresse: "123 Rue du Vin, Paris" },
  { nom: "Pierre Rouge", adresse: "456 Route du Béarn, Tarbes" },
];


export default function EntreprisesScreen() {

  const { entreprises, entrepriseActive, ajouterEntreprise, changerEntreprise } = useEntreprise();
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [donneeTestAjoutees, setDonneeTestAjoutees] = useState(false);


  useEffect(() => {

    if (entreprises.length === 0 && !donneeTestAjoutees) {
      ajouterDonneesTest();
    }

  }, [entreprises.length, donneeTestAjoutees]);


  async function ajouterDonneesTest() {

    for (const data of DONNEES_TEST) {
      await ajouterEntreprise({
        nom: data.nom,
        adresse: data.adresse,
        actif: false,
      });
    }

    setDonneeTestAjoutees(true);

  }


  async function handleAjouterEntreprise() {

    if (!nom.trim()) {
      alert("Le nom de l'entreprise est requis");
      return;
    }

    await ajouterEntreprise({
      nom: nom.trim(),
      adresse: adresse.trim() || undefined,
      actif: false,
    });

    setNom("");
    setAdresse("");
    setAfficherFormulaire(false);

  }


  return (

    <SafeAreaView style={styles.container}>

      <ScrollView>

        <Text style={styles.title}>
          🏢 Entreprises
        </Text>


        <Pressable
          style={styles.addButton}
          onPress={() => setAfficherFormulaire(true)}
        >
          <Text style={styles.buttonText}>
            ➕ Ajouter une entreprise
          </Text>
        </Pressable>


        <Text style={styles.section}>
          Entreprises enregistrées
        </Text>


        {
          entreprises.length === 0 ? (

            <View style={styles.card}>

              <Text style={styles.empty}>
                Aucune entreprise enregistrée
              </Text>

            </View>

          ) : (

            entreprises.map((entreprise: Entreprise) => (

              <Pressable
                key={entreprise.id}
                style={[
                  styles.card,
                  entrepriseActive?.id === entreprise.id && styles.cardActive,
                ]}
                onPress={() => changerEntreprise(entreprise.id)}
              >

                <View style={styles.cardHeader}>

                  <Text style={styles.nom}>
                    {entreprise.nom}
                  </Text>

                  {entrepriseActive?.id === entreprise.id && (
                    <Text style={styles.badge}>
                      ✓ Active
                    </Text>
                  )}

                </View>


                {entreprise.adresse && (
                  <Text style={styles.adresse}>
                    📍 {entreprise.adresse}
                  </Text>
                )}

              </Pressable>

            ))

          )
        }

      </ScrollView>


      <Modal
        visible={afficherFormulaire}
        animationType="slide"
        transparent
      >

        <SafeAreaView style={styles.modalContainer}>

          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>
              Ajouter une entreprise
            </Text>


            <TextInput
              style={styles.input}
              placeholder="Nom de l'entreprise *"
              value={nom}
              onChangeText={setNom}
              placeholderTextColor="#999"
            />

            <TextInput
              style={styles.input}
              placeholder="Adresse (optionnel)"
              value={adresse}
              onChangeText={setAdresse}
              placeholderTextColor="#999"
            />


            <View style={styles.modalButtons}>

              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNom("");
                  setAdresse("");
                  setAfficherFormulaire(false);
                }}
              >
                <Text style={styles.cancelButtonText}>
                  Annuler
                </Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleAjouterEntreprise}
              >
                <Text style={styles.submitButtonText}>
                  Ajouter
                </Text>
              </Pressable>

            </View>

          </View>

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
    borderLeftColor: "#DDD",
  },

  cardActive: {
    borderLeftColor: "#00695C",
    backgroundColor: "#F0F7F6",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  nom: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },

  badge: {
    backgroundColor: "#00695C",
    color: "#FFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: "bold",
  },

  adresse: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
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
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFF",
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

  input: {
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    color: "#333",
  },

  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
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
