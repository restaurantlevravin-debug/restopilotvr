import { Redirect, router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { useHaccp } from "@/context/HaccpContext";
import { useUser } from "@/context/UserContext";
import type { FrequenceControleHaccp, PointControleHaccp, TypeControleHaccp } from "@/types/controleHaccp";

const TYPES: TypeControleHaccp[] = ["TEMPERATURE", "RECEPTION", "NETTOYAGE", "AUTRE"];
const FREQUENCES: FrequenceControleHaccp[] = ["QUOTIDIEN", "HEBDOMADAIRE", "AUTRE"];

type Formulaire = {
  nom: string; description: string; zone: string; typeControle: TypeControleHaccp;
  frequence: FrequenceControleHaccp; obligatoire: boolean; actif: boolean;
  utilisateursAutorises: string[]; temperatureMin: string; temperatureMax: string;
};

const FORMULAIRE_VIDE: Formulaire = {
  nom: "", description: "", zone: "", typeControle: "TEMPERATURE", frequence: "QUOTIDIEN",
  obligatoire: true, actif: true, utilisateursAutorises: [], temperatureMin: "", temperatureMax: "",
};

export default function ConfigurationHaccpScreen() {
  const { ajouterPointControle, modifierPointControle, supprimerPointControle, obtenirPointsControleEntreprise } = useHaccp();
  const { utilisateurActif, utilisateurs } = useUser();
  const [formulaire, setFormulaire] = useState<Formulaire>(FORMULAIRE_VIDE);
  const [idModifie, setIdModifie] = useState<string>();
  const [formulaireVisible, setFormulaireVisible] = useState(false);

  if (utilisateurActif?.role !== "GERANT") return <Redirect href="/haccp" />;

  const points = obtenirPointsControleEntreprise();
  const collaborateurs = utilisateurs.filter((u) => u.actif && u.id !== utilisateurActif.id);

  function changer<K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) {
    setFormulaire((courant) => ({ ...courant, [cle]: valeur }));
  }

  function fermerFormulaire() {
    setFormulaire(FORMULAIRE_VIDE);
    setIdModifie(undefined);
    setFormulaireVisible(false);
  }

  function ouvrirModification(point: PointControleHaccp) {
    setIdModifie(point.id);
    setFormulaire({
      nom: point.nom, description: point.description ?? "", zone: point.zone,
      typeControle: point.typeControle, frequence: point.frequence,
      obligatoire: point.obligatoire, actif: point.actif,
      utilisateursAutorises: point.utilisateursAutorises,
      temperatureMin: point.temperatureMin?.toString() ?? "",
      temperatureMax: point.temperatureMax?.toString() ?? "",
    });
    setFormulaireVisible(true);
  }

  function basculerUtilisateur(id: string) {
    changer("utilisateursAutorises", formulaire.utilisateursAutorises.includes(id)
      ? formulaire.utilisateursAutorises.filter((utilisateurId) => utilisateurId !== id)
      : [...formulaire.utilisateursAutorises, id]);
  }

  async function enregistrer() {
    if (!formulaire.nom.trim() || !formulaire.zone.trim()) {
      Alert.alert("Champs requis", "Renseignez le nom du contrôle et sa zone.");
      return;
    }
    const min = formulaire.temperatureMin.trim() ? Number(formulaire.temperatureMin.replace(",", ".")) : undefined;
    const max = formulaire.temperatureMax.trim() ? Number(formulaire.temperatureMax.replace(",", ".")) : undefined;
    if (Number.isNaN(min) || Number.isNaN(max)) {
      Alert.alert("Température incorrecte", "Les limites doivent être numériques.");
      return;
    }
    const donnees = {
      nom: formulaire.nom.trim(), description: formulaire.description.trim() || undefined,
      zone: formulaire.zone.trim(), typeControle: formulaire.typeControle,
      frequence: formulaire.frequence, obligatoire: formulaire.obligatoire, actif: formulaire.actif,
      utilisateursAutorises: formulaire.utilisateursAutorises,
      temperatureMin: formulaire.typeControle === "TEMPERATURE" ? min : undefined,
      temperatureMax: formulaire.typeControle === "TEMPERATURE" ? max : undefined,
    };
    const succes = idModifie ? await modifierPointControle(idModifie, donnees) : await ajouterPointControle(donnees);
    if (!succes) {
      Alert.alert("Accès refusé", "Seul un gérant peut modifier le plan HACCP.");
      return;
    }
    fermerFormulaire();
  }

  function confirmerSuppression(point: PointControleHaccp) {
    Alert.alert("Supprimer ce point ?", point.nom, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => void supprimerPointControle(point.id) },
    ]);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Pressable onPress={() => router.back()}><Text style={styles.retour}>‹ Retour</Text></Pressable>
      <Text style={styles.surtitre}>EMPIRE RESTOPILOT</Text>
      <Text style={styles.titre}>Configuration HACCP entreprise</Text>
      <Text style={styles.intro}>Votre plan est entièrement personnalisé. Aucun contrôle ni aucune zone ne sont ajoutés automatiquement.</Text>
      <View style={styles.enteteListe}>
        <Text style={styles.sousTitre}>Mes points de contrôle</Text>
        <Pressable style={styles.boutonOr} onPress={() => { fermerFormulaire(); setFormulaireVisible(true); }}><Text style={styles.boutonOrTexte}>＋ Ajouter un point</Text></Pressable>
      </View>

      {formulaireVisible && <View style={styles.carteFormulaire}>
        <Text style={styles.carteTitre}>{idModifie ? "Modifier le contrôle" : "Nouveau contrôle"}</Text>
        <TextInput style={styles.input} placeholder="Nom du contrôle *" placeholderTextColor="#867c68" value={formulaire.nom} onChangeText={(v) => changer("nom", v)} />
        <TextInput style={styles.input} placeholder="Zone *" placeholderTextColor="#867c68" value={formulaire.zone} onChangeText={(v) => changer("zone", v)} />
        <TextInput style={[styles.input, styles.multiligne]} placeholder="Description (facultative)" placeholderTextColor="#867c68" multiline value={formulaire.description} onChangeText={(v) => changer("description", v)} />
        <Text style={styles.label}>Type</Text>
        <View style={styles.choix}>{TYPES.map((type) => <Puce key={type} texte={type} active={formulaire.typeControle === type} onPress={() => changer("typeControle", type)} />)}</View>
        <Text style={styles.label}>Fréquence</Text>
        <View style={styles.choix}>{FREQUENCES.map((f) => <Puce key={f} texte={f} active={formulaire.frequence === f} onPress={() => changer("frequence", f)} />)}</View>
        {formulaire.typeControle === "TEMPERATURE" && <View style={styles.ligneInputs}>
          <TextInput style={[styles.input, styles.demi]} placeholder="Minimum °C" placeholderTextColor="#867c68" keyboardType="decimal-pad" value={formulaire.temperatureMin} onChangeText={(v) => changer("temperatureMin", v)} />
          <TextInput style={[styles.input, styles.demi]} placeholder="Maximum °C" placeholderTextColor="#867c68" keyboardType="decimal-pad" value={formulaire.temperatureMax} onChangeText={(v) => changer("temperatureMax", v)} />
        </View>}
        <LigneSwitch label="Contrôle obligatoire" value={formulaire.obligatoire} onValueChange={(v) => changer("obligatoire", v)} />
        <LigneSwitch label="Point actif" value={formulaire.actif} onValueChange={(v) => changer("actif", v)} />
        <Text style={styles.label}>Personnes autorisées</Text>
        {collaborateurs.length === 0 ? <Text style={styles.texteSecondaire}>Aucun collaborateur actif.</Text> : collaborateurs.map((personne) =>
          <Pressable key={personne.id} style={styles.personne} onPress={() => basculerUtilisateur(personne.id)}>
            <Text style={styles.personneNom}>{formulaire.utilisateursAutorises.includes(personne.id) ? "☑" : "☐"} {personne.nom}</Text><Text style={styles.role}>{personne.role}</Text>
          </Pressable>)}
        <View style={styles.actions}><Pressable style={styles.boutonSecondaire} onPress={fermerFormulaire}><Text style={styles.boutonSecondaireTexte}>Annuler</Text></Pressable><Pressable style={styles.boutonOr} onPress={() => void enregistrer()}><Text style={styles.boutonOrTexte}>Enregistrer</Text></Pressable></View>
      </View>}

      {points.length === 0 ? <View style={styles.carte}><Text style={styles.vide}>Aucun point configuré. Créez uniquement les contrôles prévus par votre propre plan HACCP.</Text></View> : points.map((point) =>
        <View key={point.id} style={[styles.carte, !point.actif && styles.inactive]}>
          <View style={styles.carteEntete}><Text style={styles.carteTitre}>{point.nom}</Text><Text style={styles.badge}>{point.actif ? "ACTIF" : "INACTIF"}</Text></View>
          <Text style={styles.zone}>📍 {point.zone}</Text>
          <Text style={styles.texteSecondaire}>{point.typeControle} · {point.frequence} · {point.obligatoire ? "Obligatoire" : "Facultatif"}</Text>
          <Text style={styles.texteSecondaire}>{point.utilisateursAutorises.length} personne(s) autorisée(s)</Text>
          <View style={styles.actions}><Pressable style={styles.boutonSecondaire} onPress={() => ouvrirModification(point)}><Text style={styles.boutonSecondaireTexte}>Modifier</Text></Pressable><Pressable onPress={() => confirmerSuppression(point)}><Text style={styles.supprimer}>Supprimer</Text></Pressable></View>
        </View>)}
    </ScrollView>
  );
}

function Puce({ texte, active, onPress }: { texte: string; active: boolean; onPress: () => void }) {
  return <Pressable style={[styles.puce, active && styles.puceActive]} onPress={onPress}><Text style={[styles.puceTexte, active && styles.puceTexteActive]}>{texte}</Text></Pressable>;
}
function LigneSwitch({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.ligneSwitch}><Text style={styles.label}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#494137", true: "#8a641b" }} thumbColor={value ? "#f1c75b" : "#aaa"} /></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 20, paddingBottom: 50, gap: 14 }, retour: { color: "#d7b45a", fontSize: 17 },
  surtitre: { color: "#8f6b24", letterSpacing: 3, fontSize: 11, textAlign: "center" }, titre: { color: "#f4d579", fontSize: 27, fontWeight: "800", textAlign: "center" },
  intro: { color: "#b9ad98", lineHeight: 21, textAlign: "center" }, enteteListe: { gap: 12, marginTop: 8 }, sousTitre: { color: "#f7e6b0", fontSize: 21, fontWeight: "700" },
  carte: { backgroundColor: "#15130f", borderWidth: 1, borderColor: "#74551d", borderRadius: 14, padding: 16, gap: 8 }, carteFormulaire: { backgroundColor: "#12100c", borderWidth: 1, borderColor: "#c29433", borderRadius: 16, padding: 16, gap: 12 },
  carteEntete: { flexDirection: "row", justifyContent: "space-between", gap: 10 }, carteTitre: { color: "#f0d68d", fontSize: 18, fontWeight: "700", flex: 1 }, badge: { color: "#d9ba64", fontSize: 10, borderWidth: 1, borderColor: "#71551f", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  zone: { color: "#eee3c9", fontSize: 15 }, texteSecondaire: { color: "#a99d87" }, vide: { color: "#b9ad98", lineHeight: 21, textAlign: "center" }, inactive: { opacity: 0.58 },
  input: { backgroundColor: "#211e18", borderWidth: 1, borderColor: "#4f432c", borderRadius: 10, color: "#fff4d5", paddingHorizontal: 12, paddingVertical: 11 }, multiligne: { minHeight: 72, textAlignVertical: "top" }, label: { color: "#dacb9f", fontWeight: "600" },
  choix: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, puce: { borderWidth: 1, borderColor: "#4f432c", borderRadius: 18, paddingHorizontal: 11, paddingVertical: 8 }, puceActive: { backgroundColor: "#7a5818", borderColor: "#d6ad4d" }, puceTexte: { color: "#aa9f8a", fontSize: 12 }, puceTexteActive: { color: "#fff0ba", fontWeight: "700" },
  ligneInputs: { flexDirection: "row", gap: 10 }, demi: { flex: 1 }, ligneSwitch: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, personne: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#403723", paddingVertical: 9 }, personneNom: { color: "#f0e5c8" }, role: { color: "#9b8d76", fontSize: 12 },
  actions: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 14, marginTop: 6 }, boutonOr: { backgroundColor: "#a97922", borderRadius: 10, paddingHorizontal: 15, paddingVertical: 11, alignSelf: "flex-start" }, boutonOrTexte: { color: "#090909", fontWeight: "800" }, boutonSecondaire: { borderWidth: 1, borderColor: "#765d2c", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 }, boutonSecondaireTexte: { color: "#e7ce86", fontWeight: "700" }, supprimer: { color: "#e28578", fontWeight: "600", padding: 8 },
});
