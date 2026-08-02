import { Link } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Salarie = {
  nom: string;
  prenom: string;
  fonction: string;
};

export default function Personnel() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [fonction, setFonction] = useState("");

  const [personnel, setPersonnel] = useState<Salarie[]>([]);

  function ajouterSalarie() {
    if (!nom.trim() || !prenom.trim() || !fonction.trim()) {
      return;
    }

    setPersonnel([
      ...personnel,
      {
        nom,
        prenom,
        fonction,
      },
    ]);

    setNom("");
    setPrenom("");
    setFonction("");
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>👥 Personnel</Text>

      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={nom}
        onChangeText={setNom}
      />

      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={prenom}
        onChangeText={setPrenom}
      />

      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />

      <Pressable style={styles.button} onPress={ajouterSalarie}>
        <Text style={styles.buttonText}>💾 Enregistrer</Text>
      </Pressable>

      <Text style={styles.section}>Salariés enregistrés</Text>

      {personnel.length === 0 ? (
        <Text style={styles.empty}>
          Aucun salarié enregistré.
        </Text>
      ) : (
        personnel.map((p, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.nom}>
              👤 {p.prenom} {p.nom}
            </Text>

            <Text style={styles.fonction}>
              {p.fonction}
            </Text>
          </View>
        ))
      )}

      <Link href="/" asChild>
        <Pressable style={styles.backButton}>
          <Text style={styles.buttonText}>⬅ Retour</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#00695C",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 30,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#00695C",
    padding: 18,
    borderRadius: 12,
  },

  buttonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 18,
  },

  section: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#00695C",
    marginTop: 35,
    marginBottom: 15,
  },

  empty: {
    color: "#777777",
    fontStyle: "italic",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    borderLeftWidth: 6,
    borderLeftColor: "#B08D57",
  },

  nom: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222222",
  },

  fonction: {
    marginTop: 6,
    color: "#666666",
    fontSize: 16,
  },

  backButton: {
    backgroundColor: "#666666",
    padding: 18,
    borderRadius: 12,
    marginTop: 25,
    marginBottom: 40,
  },
});