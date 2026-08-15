import type { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

export default function PadLayout({ children, overlay }: { children: ReactNode; overlay?: ReactNode }) {
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><View style={styles.cadre}>{children}</View></ScrollView>{overlay}</SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#080706" }, contenu: { flexGrow: 1, padding: 28, alignItems: "center", justifyContent: "center" }, cadre: { width: "100%", maxWidth: 760, minHeight: 560, justifyContent: "center", alignItems: "center", gap: 20 } });
