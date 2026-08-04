import { Link } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function Home() {
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
});
