import { Redirect, Stack, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";

import DashboardGerant from "@/components/dashboard/DashboardGerant";
import { PointagePadProvider } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";
import { ValidationHeuresProvider } from "@/context/ValidationHeuresContext";

export default function DashboardGerantScreen() {
  const router = useRouter();
  const { utilisateurActif } = useUser();

  if (!utilisateurActif) {
    return (
      <SafeAreaView style={styles.accesVide}>
        <Text style={styles.accesTitre}>Identification requise</Text>
        <Text style={styles.accesTexte}>
          Sélectionnez un compte gérant pour ouvrir ce dashboard.
        </Text>
      </SafeAreaView>
    );
  }

  if (utilisateurActif?.role !== "GERANT") {
    return <Redirect href="/" />;
  }

  return (
    <PointagePadProvider mode="GESTION_GERANT">
      <ValidationHeuresProvider><SafeAreaView style={styles.ecran}>
        <Stack.Screen options={{ title: "Dashboard Gérant", headerShown: false }} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          onPress={() => router.back()}
          style={styles.retour}
        >
          <Text style={styles.retourTexte}>‹ Retour</Text>
        </Pressable>
        <DashboardGerant />
      </SafeAreaView></ValidationHeuresProvider>
    </PointagePadProvider>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: "#080706" },
  accesVide: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#080706" },
  accesTitre: { color: "#F4D887", fontSize: 22, fontWeight: "900" },
  accesTexte: { color: "#AFA48E", fontSize: 14, textAlign: "center", marginTop: 9 },
  retour: { alignSelf: "flex-start", marginHorizontal: 18, marginTop: 6, paddingVertical: 8, paddingRight: 16 },
  retourTexte: { color: "#D6A945", fontSize: 16, fontWeight: "800" },
});
