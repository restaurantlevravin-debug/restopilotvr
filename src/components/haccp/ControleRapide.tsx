import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useHaccp } from "@/context/HaccpContext";
import { useAnomaliesHaccp } from "@/context/AnomalieHaccpContext";
import type { PointControleHaccp, TypeControleHaccp } from "@/types/controleHaccp";

const ICONE_TYPE: Record<TypeControleHaccp, string> = {
  TEMPERATURE: "🌡️", RECEPTION: "📦", NETTOYAGE: "✨", AUTRE: "✓",
};

function libelleType(type: TypeControleHaccp) {
  return ({ TEMPERATURE: "Contrôle température", RECEPTION: "Contrôle réception", NETTOYAGE: "Contrôle nettoyage", AUTRE: "Contrôle HACCP" } as const)[type];
}

export function ControleRapide() {
  const { obtenirMesControles, enregistrerControleRealise } = useHaccp();
  const { creerAnomalie } = useAnomaliesHaccp();
  const [point, setPoint] = useState<PointControleHaccp>();
  const [valeur, setValeur] = useState("");
  const [anomalieSignalee, setAnomalieSignalee] = useState(false);
  const [photo, setPhoto] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [actionCorrective, setActionCorrective] = useState("");
  const [enregistrement, setEnregistrement] = useState(false);
  const [confirmation, setConfirmation] = useState<"CONFORME" | "ANOMALIE">();
  const points = obtenirMesControles();

  const nombre = Number(valeur.replace(",", "."));
  const valeurNumeriqueValide = valeur.trim() !== "" && !Number.isNaN(nombre);
  const horsLimites = point?.typeControle === "TEMPERATURE" && valeurNumeriqueValide && (
    (point.temperatureMin !== undefined && nombre < point.temperatureMin)
    || (point.temperatureMax !== undefined && nombre > point.temperatureMax)
  );
  const nonConforme = Boolean(horsLimites || anomalieSignalee);

  function reinitialiser(revenirListe = true) {
    if (revenirListe) setPoint(undefined);
    setValeur(""); setAnomalieSignalee(false); setPhoto("");
    setCommentaire(""); setActionCorrective(""); setConfirmation(undefined);
  }

  function ajuster(delta: number) {
    const valeurActuelle = valeurNumeriqueValide ? nombre : 0;
    setValeur(String(Math.round((valeurActuelle + delta) * 10) / 10));
  }

  async function prendrePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Caméra requise", "Autorisez la caméra pour documenter l'anomalie.");
      return;
    }
    const resultat = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!resultat.canceled) setPhoto(resultat.assets[0].uri);
  }

  async function valider() {
    if (!point || !valeur.trim()) {
      Alert.alert("Valeur manquante", "Saisissez le résultat du contrôle.");
      return;
    }
    if (point.typeControle === "TEMPERATURE" && !valeurNumeriqueValide) {
      Alert.alert("Valeur incorrecte", "Saisissez une température numérique.");
      return;
    }
    if (nonConforme && (!photo || !commentaire.trim() || !actionCorrective.trim())) {
      Alert.alert("Anomalie à documenter", "Ajoutez la photo, la description et la mesure prise.");
      return;
    }

    setEnregistrement(true);
    const maintenant = new Date();
    const controleEnregistre = await enregistrerControleRealise({
      pointControleId: point.id,
      date: maintenant.toLocaleDateString("fr-FR"),
      heure: maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      valeur: valeur.trim(),
      conforme: !nonConforme,
      photo: photo || undefined,
      commentaire: commentaire.trim() || undefined,
      actionCorrective: actionCorrective.trim() || undefined,
      statutValidation: nonConforme ? "EN_ATTENTE" : "CLOS",
    });
    setEnregistrement(false);
    if (!controleEnregistre) {
      Alert.alert("Contrôle indisponible", "Ce contrôle n'est plus actif ou ne vous est pas attribué.");
      reinitialiser();
      return;
    }
    if (nonConforme) {
      const anomalie = await creerAnomalie({
        controleId: controleEnregistre.id,
        type: point.nom,
        description: commentaire.trim(),
        photo,
        actionCorrective: actionCorrective.trim(),
        priorite: "IMPORTANTE",
      });
      if (!anomalie) {
        Alert.alert("Enregistrement incomplet", "Le contrôle est conservé, mais l'anomalie doit être resoumise.");
        return;
      }
    }
    setConfirmation(nonConforme ? "ANOMALIE" : "CONFORME");
  }

  if (confirmation) {
    return <View style={styles.confirmation}>
      <Text style={styles.confirmationIcone}>{confirmation === "CONFORME" ? "✅" : "⚠️"}</Text>
      <Text style={styles.confirmationTitre}>{confirmation === "CONFORME" ? "Contrôle conforme" : "Anomalie transmise"}</Text>
      <Text style={styles.confirmationTexte}>{confirmation === "CONFORME" ? "Contrôle enregistré et progression mise à jour." : "Validation responsable nécessaire."}</Text>
      <Pressable style={styles.boutonPrincipal} onPress={() => reinitialiser()}><Text style={styles.boutonPrincipalTexte}>Terminer</Text></Pressable>
    </View>;
  }

  if (!point) {
    return <ScrollView contentContainerStyle={styles.liste}>
      {points.length === 0 ? <View style={styles.carte}><Text style={styles.vide}>Aucun contrôle actif ne vous est attribué.</Text></View> : points.map((controle) =>
        <View key={controle.id} style={styles.carte}>
          <View style={styles.enteteCarte}><Text style={styles.icone}>{ICONE_TYPE[controle.typeControle]}</Text><View style={styles.titres}><Text style={styles.nom}>{controle.nom}</Text><Text style={styles.zone}>{controle.zone}</Text><Text style={styles.type}>{libelleType(controle.typeControle)}</Text></View></View>
          <Pressable style={styles.boutonPrincipal} onPress={() => setPoint(controle)}><Text style={styles.boutonPrincipalTexte}>Effectuer le contrôle</Text></Pressable>
        </View>)}
    </ScrollView>;
  }

  return <ScrollView contentContainerStyle={styles.formulaire} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => reinitialiser()}><Text style={styles.retour}>‹ Changer de contrôle</Text></Pressable>
    <View style={styles.carteSelectionnee}><Text style={styles.iconeGrande}>{ICONE_TYPE[point.typeControle]}</Text><Text style={styles.nomCentre}>{point.nom}</Text><Text style={styles.zoneCentre}>{point.zone}</Text></View>
    <Text style={styles.label}>{point.typeControle === "TEMPERATURE" ? "Température" : "Valeur / résultat"}</Text>
    {point.typeControle === "TEMPERATURE" ? <View style={styles.saisieTemperature}>
      <Pressable style={styles.boutonAjustement} onPress={() => ajuster(-0.5)}><Text style={styles.ajustementTexte}>−</Text></Pressable>
      <TextInput style={styles.temperatureInput} value={valeur} onChangeText={setValeur} keyboardType="decimal-pad" placeholder="0,0" placeholderTextColor="#716957" selectTextOnFocus />
      <Pressable style={styles.boutonAjustement} onPress={() => ajuster(0.5)}><Text style={styles.ajustementTexte}>＋</Text></Pressable>
    </View> : <TextInput style={styles.input} value={valeur} onChangeText={setValeur} placeholder="Saisir le résultat" placeholderTextColor="#716957" />}
    {point.typeControle === "TEMPERATURE" && (point.temperatureMin !== undefined || point.temperatureMax !== undefined) && (
      <Text style={styles.limites}>Plage configurée : {point.temperatureMin ?? "—"} °C à {point.temperatureMax ?? "—"} °C</Text>
    )}

    <Pressable style={[styles.boutonAnomalie, anomalieSignalee && styles.boutonAnomalieActif]} onPress={() => setAnomalieSignalee((courant) => !courant)}><Text style={styles.boutonAnomalieTexte}>⚠️ {anomalieSignalee ? "Anomalie signalée" : "Signaler une anomalie"}</Text></Pressable>
    {nonConforme && <View style={styles.blocAnomalie}>
      <Text style={styles.alerte}>Anomalie détectée — preuve obligatoire</Text>
      <Pressable style={styles.boutonPhoto} onPress={() => void prendrePhoto()}><Text style={styles.boutonPhotoTexte}>{photo ? "✓ Photo ajoutée" : "📷 Prendre une photo"}</Text></Pressable>
      {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : null}
      <TextInput style={[styles.input, styles.multiligne]} value={commentaire} onChangeText={setCommentaire} placeholder="Décrire l'anomalie" placeholderTextColor="#716957" multiline />
      <TextInput style={[styles.input, styles.multiligne]} value={actionCorrective} onChangeText={setActionCorrective} placeholder="Mesure prise" placeholderTextColor="#716957" multiline />
      <Text style={styles.validationInfo}>🔐 Validation responsable nécessaire</Text>
    </View>}
    <Pressable style={[styles.boutonPrincipal, enregistrement && styles.desactive]} disabled={enregistrement} onPress={() => void valider()}><Text style={styles.boutonPrincipalTexte}>{enregistrement ? "Enregistrement…" : "Valider le contrôle"}</Text></Pressable>
  </ScrollView>;
}

const styles = StyleSheet.create({
  liste: { padding: 18, gap: 14, paddingBottom: 40 }, formulaire: { padding: 18, gap: 16, paddingBottom: 50 }, carte: { backgroundColor: "#171510", borderColor: "#715420", borderWidth: 1, borderRadius: 16, padding: 18, gap: 16 }, enteteCarte: { flexDirection: "row", alignItems: "center", gap: 14 }, icone: { fontSize: 34 }, titres: { flex: 1, gap: 3 }, nom: { color: "#f4dda0", fontSize: 19, fontWeight: "800" }, zone: { color: "#d2c6aa", fontSize: 15 }, type: { color: "#91866e", fontSize: 13 }, vide: { color: "#b9ad98", textAlign: "center", fontSize: 16 }, boutonPrincipal: { minHeight: 56, backgroundColor: "#b3842d", borderRadius: 13, justifyContent: "center", alignItems: "center", paddingHorizontal: 18 }, boutonPrincipalTexte: { color: "#0b0906", fontSize: 17, fontWeight: "900" }, retour: { color: "#d5b45f", fontSize: 16, paddingVertical: 4 }, carteSelectionnee: { alignItems: "center", backgroundColor: "#171510", borderColor: "#715420", borderWidth: 1, borderRadius: 16, padding: 18, gap: 5 }, iconeGrande: { fontSize: 40 }, nomCentre: { color: "#f4dda0", fontSize: 22, fontWeight: "800", textAlign: "center" }, zoneCentre: { color: "#bcb096", fontSize: 15, textAlign: "center" }, label: { color: "#f0d68d", fontSize: 17, fontWeight: "700" }, saisieTemperature: { flexDirection: "row", alignItems: "stretch", gap: 10 }, boutonAjustement: { width: 68, minHeight: 68, backgroundColor: "#2a251b", borderColor: "#806126", borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, ajustementTexte: { color: "#f4d579", fontSize: 34, fontWeight: "700" }, temperatureInput: { flex: 1, minHeight: 68, backgroundColor: "#f4edda", color: "#17120a", borderRadius: 14, textAlign: "center", fontSize: 27, fontWeight: "800" }, limites: { color: "#b8ab8e", textAlign: "center", marginTop: -8 }, input: { minHeight: 56, backgroundColor: "#211e18", borderColor: "#51452f", borderWidth: 1, borderRadius: 12, color: "#fff3d0", paddingHorizontal: 14, fontSize: 17 }, multiligne: { minHeight: 80, paddingTop: 14, textAlignVertical: "top" }, boutonAnomalie: { minHeight: 54, borderColor: "#776b55", borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }, boutonAnomalieActif: { backgroundColor: "#50211c", borderColor: "#dc7869" }, boutonAnomalieTexte: { color: "#f0c7a4", fontSize: 16, fontWeight: "700" }, blocAnomalie: { backgroundColor: "#21120f", borderColor: "#8c392e", borderWidth: 1, borderRadius: 14, padding: 14, gap: 12 }, alerte: { color: "#ff9a89", fontWeight: "800", fontSize: 16 }, boutonPhoto: { minHeight: 54, backgroundColor: "#43351d", borderRadius: 11, alignItems: "center", justifyContent: "center" }, boutonPhotoTexte: { color: "#f4dda0", fontWeight: "800", fontSize: 16 }, photo: { width: "100%", height: 180, borderRadius: 12 }, validationInfo: { color: "#e8c46c", fontWeight: "700" }, confirmation: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 16 }, confirmationIcone: { fontSize: 64 }, confirmationTitre: { color: "#f4dda0", fontSize: 27, fontWeight: "900", textAlign: "center" }, confirmationTexte: { color: "#bfb39b", fontSize: 16, textAlign: "center", lineHeight: 23 }, desactive: { opacity: 0.55 },
});
