import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { Utilisateur } from "@/types/entreprise";

export default function ValidationPin({ utilisateur, erreur, enCours, onValider, onRetour }: { utilisateur: Utilisateur; erreur?: string; enCours?: boolean; onValider: (pin: string) => void; onRetour: () => void }) {
  const [pin, setPin] = useState("");
  return <View style={styles.zone}><Text style={styles.titre}>{utilisateur.nom}</Text><Text style={styles.poste}>{utilisateur.poste || "Équipe"}</Text><Text style={styles.label}>PIN :</Text><TextInput autoFocus value={pin} onChangeText={(valeur) => setPin(valeur.replace(/\D/g, "").slice(0, 8))} style={styles.pin} keyboardType="number-pad" secureTextEntry placeholder="● ● ● ●" placeholderTextColor="#756b57" textAlign="center" />{erreur ? <Text style={styles.erreur}>PIN incorrect</Text> : null}<Pressable disabled={enCours} style={[styles.valider, enCours && styles.desactive]} onPress={() => onValider(pin)}><Text style={styles.validerTexte}>{enCours ? "Vérification…" : "VALIDER"}</Text></Pressable><Pressable style={styles.retour} onPress={onRetour}><Text style={styles.retourTexte}>‹ Changer de profil</Text></Pressable></View>;
}

const styles = StyleSheet.create({ zone: { width: "100%", maxWidth: 480, alignItems: "center", gap: 13 }, titre: { color: "#f1dfb7", fontSize: 27, fontWeight: "900" }, poste: { color: "#a99d84" }, label: { color: "#e2c66f", fontSize: 18, fontWeight: "900", marginTop: 12 }, pin: { width: "100%", height: 82, backgroundColor: "#17140f", borderWidth: 2, borderColor: "#80632b", borderRadius: 17, color: "#fff", fontSize: 35, letterSpacing: 12 }, erreur: { color: "#ef756b", fontSize: 16, fontWeight: "900" }, valider: { width: "100%", minHeight: 68, borderRadius: 15, backgroundColor: "#ad812e", alignItems: "center", justifyContent: "center" }, desactive: { opacity: 0.55 }, validerTexte: { color: "#100b04", fontSize: 19, fontWeight: "900" }, retour: { padding: 14 }, retourTexte: { color: "#aea28c", fontWeight: "800" } });
