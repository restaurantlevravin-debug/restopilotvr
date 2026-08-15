import { Stack, useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text } from "react-native";

import ProfilImperial from "@/components/ProfilImperial";

export default function ProfilImperialScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.ecran}>
      <Stack.Screen options={{ title: "Profil impérial", headerShown: false }} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={() => router.back()}
        style={styles.retour}
      >
        <Text style={styles.retourTexte}>‹ Retour</Text>
      </Pressable>
      <ProfilImperial />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1, backgroundColor: "#080706" },
  retour: { alignSelf: "flex-start", marginHorizontal: 20, marginTop: 8, paddingVertical: 8, paddingRight: 16 },
  retourTexte: { color: "#D7A83E", fontSize: 16, fontWeight: "700" },
});
