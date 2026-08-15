import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { useUser } from "@/context/UserContext";
import { obtenirDocumentsSalarie } from "@/services/documentService";
import type { DocumentSalarie } from "@/types/documentSalarie";

export default function MesDocumentsScreen() {
  const { utilisateurActif } = useUser();
  const [documents, setDocuments] = useState<DocumentSalarie[]>([]);
  useEffect(() => { if (utilisateurActif?.consultationDocumentsAutorisee) void obtenirDocumentsSalarie(utilisateurActif, utilisateurActif).then(setDocuments); }, [utilisateurActif]);
  if (!utilisateurActif || utilisateurActif.role === "GERANT" || !utilisateurActif.consultationDocumentsAutorisee) return <Redirect href="/" />;
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}><Text style={styles.surtitre}>ESPACE PERSONNEL</Text><Text style={styles.titre}>Mes documents</Text><Text style={styles.intro}>Consultation uniquement · {documents.length} document(s)</Text>{documents.map((document) => <View key={document.id} style={styles.carte}><Text style={styles.nom}>📄 {document.nom}</Text><Text style={styles.meta}>{document.categorie} · {new Date(document.dateAjout).toLocaleDateString("fr-FR")}</Text>{document.commentaire ? <Text style={styles.commentaire}>{document.commentaire}</Text> : null}<Pressable style={styles.bouton} onPress={() => void Linking.openURL(document.fileUri)}><Text style={styles.boutonTexte}>Ouvrir le PDF</Text></Pressable></View>)}{documents.length === 0 && <Text style={styles.vide}>Aucun document disponible.</Text>}</ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 18, gap: 14 }, surtitre: { color: "#957129", fontSize: 10, letterSpacing: 3, textAlign: "center" }, titre: { color: "#efd27a", fontSize: 28, fontWeight: "900", textAlign: "center" }, intro: { color: "#aaa08a", textAlign: "center" }, carte: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#5d4821", borderRadius: 14, padding: 15, gap: 8 }, nom: { color: "#f1e5c7", fontSize: 17, fontWeight: "800" }, meta: { color: "#bc9c4f", fontSize: 12 }, commentaire: { color: "#aaa08a" }, bouton: { minHeight: 46, borderWidth: 1, borderColor: "#94702a", borderRadius: 9, alignItems: "center", justifyContent: "center" }, boutonTexte: { color: "#e5c972", fontWeight: "900" }, vide: { color: "#9b927e", textAlign: "center", padding: 30 } });
