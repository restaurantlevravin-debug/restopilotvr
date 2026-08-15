import { Link, type Href } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

import { useUser } from "@/context/UserContext";

export default function Home() {
  const { utilisateurActif } = useUser();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>🍷</Text>

      <Text style={styles.title}>RestoPilot</Text>

      <Text style={styles.subtitle}>
        Assistant de gestion des restaurateurs
      </Text>

      <Link href="/personnel" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>👥 Personnel</Text>
        </TouchableOpacity>
      </Link>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>📅 Planning</Text>
      </TouchableOpacity>

      <Link href="/haccp" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>📋 HACCP</Text>
        </TouchableOpacity>
      </Link>

      {utilisateurActif?.role === "GERANT" ? (
        <Link href={"/dashboard-gerant" as Href} asChild>
          <TouchableOpacity style={styles.imperialButton}>
            <Text style={styles.buttonText}>👑 Dashboard Gérant</Text>
          </TouchableOpacity>
        </Link>
      ) : null}

      {utilisateurActif && utilisateurActif.role !== "GERANT" ? (
        <Link href={"/profil-imperial" as Href} asChild>
          <TouchableOpacity style={styles.imperialButton}>
            <Text style={styles.buttonText}>👑 Mon profil impérial</Text>
          </TouchableOpacity>
        </Link>
      ) : null}

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>📖 Fiches techniques</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>💬 Messagerie</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F3F3",
    justifyContent: "center",
    padding: 20,
  },

  logo: {
    fontSize: 60,
    textAlign: "center",
    marginBottom: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    color: "#00695C",
  },

  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 40,
  },

  button: {
    backgroundColor: "#00695C",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },

  buttonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  imperialButton: {
    backgroundColor: "#17120A",
    borderColor: "#D7A83E",
    borderWidth: 1,
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
  },
});
