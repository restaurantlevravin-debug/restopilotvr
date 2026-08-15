import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { rewards } from "@/constants/rewards";
import { useEntreprise } from "@/context/EntrepriseContext";
import { usePointagePad } from "@/context/PointagePadContext";
import { useRewards } from "@/context/RewardContext";
import { useUser } from "@/context/UserContext";
import type { Utilisateur } from "@/types/entreprise";

export default function SelectionUtilisateur({ selectionId, onSelectionner, onRetour }: { selectionId?: string; onSelectionner: (utilisateur: Utilisateur) => void; onRetour: () => void }) {
  const { entrepriseActive } = useEntreprise();
  const { configurationPad } = usePointagePad();
  const { utilisateurs } = useUser();
  const { obtenirProfilImperial } = useRewards();
  const salaries = configurationPad?.actif && configurationPad.entrepriseId === entrepriseActive?.id
    ? utilisateurs.filter((utilisateur) => utilisateur.entrepriseId === configurationPad.entrepriseId && utilisateur.actif && utilisateur.role !== "GERANT") : [];
  return <><Text style={styles.titre}>Qui êtes-vous ?</Text><ScrollView style={styles.liste} contentContainerStyle={styles.grille}>{salaries.map((utilisateur) => { const profil = obtenirProfilImperial(utilisateur.id); const avatar = rewards.find((item) => item.id === profil?.avatarActuel)?.image; const mots = utilisateur.nom.trim().split(/\s+/); return <Pressable key={utilisateur.id} style={[styles.carte, selectionId === utilisateur.id && styles.active]} onPress={() => onSelectionner(utilisateur)}>{avatar ? <Image source={avatar} style={styles.avatar} /> : <Text style={styles.emoji}>👨‍🍳</Text>}<View style={styles.identite}><Text style={styles.prenom}>{mots[0]}</Text><Text style={styles.nom}>{mots.slice(1).join(" ")}</Text></View></Pressable>; })}</ScrollView><Pressable style={styles.retour} onPress={onRetour}><Text style={styles.retourTexte}>‹ Retour</Text></Pressable></>;
}

const styles = StyleSheet.create({ titre: { color: "#f0d17a", fontSize: 28, fontWeight: "900" }, liste: { width: "100%", maxHeight: 480 }, grille: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", padding: 4 }, carte: { width: "30%", minWidth: 180, minHeight: 190, backgroundColor: "#17140f", borderWidth: 2, borderColor: "#4c4027", borderRadius: 18, alignItems: "center", justifyContent: "center", padding: 14 }, active: { borderColor: "#d1a23c", backgroundColor: "#30240f" }, avatar: { width: 82, height: 108, borderRadius: 12, borderWidth: 1, borderColor: "#8d6b2a" }, emoji: { fontSize: 48 }, identite: { alignItems: "center", marginTop: 9 }, prenom: { color: "#f3e7ca", fontSize: 19, fontWeight: "900" }, nom: { color: "#b0a48d", fontSize: 14 }, retour: { padding: 14 }, retourTexte: { color: "#b7aa8f", fontSize: 17, fontWeight: "800" } });
