import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAnomaliesHaccp } from "@/context/AnomalieHaccpContext";
import { useUser } from "@/context/UserContext";
import type { PrioriteAnomalieHaccp } from "@/types/anomalieHaccp";

export default function MesAnomaliesScreen() {
  const { anomalies, creerAnomalie } = useAnomaliesHaccp();
  const { utilisateurActif } = useUser();
  const [formulaire, setFormulaire] = useState(false);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState("");
  const [action, setAction] = useState("");
  const [priorite, setPriorite] = useState<PrioriteAnomalieHaccp>("NORMALE");
  const mesAnomalies = anomalies.filter((a) => a.utilisateurDeclarationId === utilisateurActif?.id).sort((a, b) => b.dateCreation.localeCompare(a.dateCreation));

  async function prendrePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert("Caméra requise", "Autorisez la caméra pour joindre une preuve."); return; }
    const resultat = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!resultat.canceled) setPhoto(resultat.assets[0].uri);
  }

  async function declarer() {
    if (!type.trim() || !description.trim() || !photo || !action.trim()) {
      Alert.alert("Déclaration incomplète", "Type, description, photo et action proposée sont obligatoires.");
      return;
    }
    const anomalie = await creerAnomalie({ controleId: `declaration-${Date.now()}`, type, description, photo, actionCorrective: action, priorite });
    if (!anomalie) { Alert.alert("Erreur", "Impossible d'enregistrer l'anomalie."); return; }
    setType(""); setDescription(""); setPhoto(""); setAction(""); setPriorite("NORMALE"); setFormulaire(false);
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}>
    <Text style={styles.surtitre}>HACCP</Text><Text style={styles.titre}>Mes anomalies déclarées</Text>
    <Pressable style={styles.principal} onPress={() => setFormulaire((v) => !v)}><Text style={styles.principalTexte}>{formulaire ? "Annuler" : "＋ Déclarer une anomalie"}</Text></Pressable>
    {formulaire && <View style={styles.formulaire}>
      <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="Type d'anomalie" placeholderTextColor="#817660" />
      <TextInput style={[styles.input, styles.multiligne]} value={description} onChangeText={setDescription} placeholder="Décrire l'anomalie" placeholderTextColor="#817660" multiline />
      <TextInput style={[styles.input, styles.multiligne]} value={action} onChangeText={setAction} placeholder="Action corrective proposée" placeholderTextColor="#817660" multiline />
      <Text style={styles.label}>Priorité</Text><View style={styles.choix}>{(["NORMALE", "IMPORTANTE", "CRITIQUE"] as const).map((p) => <Pressable key={p} style={[styles.puce, priorite === p && styles.puceActive]} onPress={() => setPriorite(p)}><Text style={styles.puceTexte}>{p}</Text></Pressable>)}</View>
      <Pressable style={styles.photoBouton} onPress={() => void prendrePhoto()}><Text style={styles.photoTexte}>{photo ? "✓ Photo ajoutée" : "📷 Prendre une photo"}</Text></Pressable>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : null}
      <Pressable style={styles.principal} onPress={() => void declarer()}><Text style={styles.principalTexte}>Envoyer l'anomalie</Text></Pressable>
    </View>}
    {mesAnomalies.length === 0 ? <View style={styles.carte}><Text style={styles.secondaire}>Aucune anomalie déclarée.</Text></View> : mesAnomalies.map((a) => <View key={a.id} style={styles.carte}>
      <View style={styles.entete}><Text style={styles.nom}>{a.type}</Text><Text style={[styles.statut, a.priorite === "CRITIQUE" && styles.critique]}>{a.statut}</Text></View>
      <Text style={styles.description}>{a.description}</Text><Text style={styles.secondaire}>{a.dateCreation} · {a.heureCreation} · {a.priorite}</Text>
      <Image source={{ uri: a.photo }} style={styles.miniPhoto} />
      {a.actionCorrective ? <Text style={styles.action}>Mesure proposée : {a.actionCorrective}</Text> : null}
    </View>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 18, gap: 14, paddingBottom: 50 }, surtitre: { color: "#8f6b24", letterSpacing: 3, textAlign: "center", fontSize: 11 }, titre: { color: "#f4d579", fontSize: 27, fontWeight: "900", textAlign: "center" }, principal: { minHeight: 54, backgroundColor: "#ad7f28", borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, principalTexte: { color: "#090806", fontWeight: "900", fontSize: 16 }, formulaire: { backgroundColor: "#15130f", borderWidth: 1, borderColor: "#775820", borderRadius: 15, padding: 15, gap: 12 }, input: { minHeight: 54, backgroundColor: "#242018", borderWidth: 1, borderColor: "#51462f", borderRadius: 11, color: "#fff2ce", paddingHorizontal: 13, fontSize: 16 }, multiligne: { minHeight: 78, paddingTop: 13, textAlignVertical: "top" }, label: { color: "#ddca91", fontWeight: "700" }, choix: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, puce: { borderWidth: 1, borderColor: "#67583b", borderRadius: 16, padding: 9 }, puceActive: { backgroundColor: "#765416" }, puceTexte: { color: "#f0d998", fontSize: 12, fontWeight: "700" }, photoBouton: { minHeight: 52, backgroundColor: "#3c321f", borderRadius: 11, alignItems: "center", justifyContent: "center" }, photoTexte: { color: "#eed48c", fontWeight: "800" }, photo: { width: "100%", height: 180, borderRadius: 12 }, carte: { backgroundColor: "#171510", borderWidth: 1, borderColor: "#645022", borderRadius: 14, padding: 15, gap: 9 }, entete: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, nom: { color: "#f1d996", fontSize: 18, fontWeight: "800", flex: 1 }, statut: { color: "#d9bb6c", fontSize: 11, fontWeight: "800" }, critique: { color: "#ff8271" }, description: { color: "#eee4cc", fontSize: 15 }, secondaire: { color: "#a99e88" }, miniPhoto: { width: "100%", height: 130, borderRadius: 10 }, action: { color: "#d8c69b", fontWeight: "600" } });
