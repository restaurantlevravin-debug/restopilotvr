import { Redirect, router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { TableauPlanning } from "@/components/planning/TableauPlanning";
import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { useUser } from "@/context/UserContext";
import { exportPlanningPDF } from "@/services/planningPdfService";
import { REMARQUES_PLANNING, type JourPlanning, type LignePlanningMensuel } from "@/types/planning";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
type Edition = { utilisateurId: string; jour: JourPlanning };

export default function GestionPlanningMensuelScreen() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif } = useUser();
  const { obtenirPlanningEntreprise, genererPlanningMois, modifierPlanning, validerPlanning, calculerHeures } = usePlanning();
  const maintenant = new Date();
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [edition, setEdition] = useState<Edition>();
  if (!entrepriseActive || utilisateurActif?.role !== "GERANT") return <Redirect href="/" />;

  const planning = obtenirPlanningEntreprise(mois, annee);
  const ligneEdition = planning?.lignes.find((ligne) => ligne.utilisateurId === edition?.utilisateurId);

  function changerMois(delta: number) {
    const date = new Date(annee, mois - 1 + delta, 1);
    setMois(date.getMonth() + 1); setAnnee(date.getFullYear()); setEdition(undefined);
  }

  function ouvrirEdition(ligne: LignePlanningMensuel, jour: JourPlanning) {
    setEdition({ utilisateurId: ligne.utilisateurId, jour: { ...jour, matin: { ...jour.matin }, soir: { ...jour.soir } } });
  }

  async function enregistrer() {
    if (!planning || !edition) return;
    const horaireValide = (debut: string, fin: string) => (!debut && !fin) || (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(debut) && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(fin));
    if (!horaireValide(edition.jour.matin.heureDebut, edition.jour.matin.heureFin) || !horaireValide(edition.jour.soir.heureDebut, edition.jour.soir.heureFin)) {
      Alert.alert("Horaires incomplets", "Utilisez le format HH:MM avec un début et une fin."); return;
    }
    const lignes = planning.lignes.map((ligne) => ligne.utilisateurId === edition.utilisateurId ? { ...ligne, jours: ligne.jours.map((jour) => jour.date === edition.jour.date ? edition.jour : jour) } : ligne);
    if (await modifierPlanning(planning.id, { lignes })) setEdition(undefined);
  }

  function appliquerRemarque(remarque: typeof REMARQUES_PLANNING[number]) {
    if (!edition) return;
    const estAbsence = ["Congé payé", "Arrêt travail", "Récupération", "Repos", "Absence exceptionnelle"].includes(remarque);
    setEdition({ ...edition, jour: { ...edition.jour, remarque, ...(estAbsence ? { matin: { heureDebut: "", heureFin: "" }, soir: { heureDebut: "", heureFin: "" } } : {}) } });
  }

  function confirmerValidation() {
    if (!planning) return;
    Alert.alert("Valider le mois ?", "Le tableau deviendra non modifiable.", [
      { text: "Annuler", style: "cancel" },
      { text: "Valider", onPress: () => void validerPlanning(planning.id) },
    ]);
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
    <Text style={styles.surtitre}>GESTION ENTREPRISE</Text><Text style={styles.titre}>Planning mensuel</Text>
    <View style={styles.navigationModule}><Pressable style={styles.onglet} onPress={() => router.push("/planning-recurrent" as Href)}><Text style={styles.ongletTexte}>↻ Modèle récurrent</Text></Pressable><View style={[styles.onglet, styles.ongletActif]}><Text style={styles.ongletActifTexte}>▦ Planning mensuel</Text></View>{planning && <Pressable style={styles.onglet} onPress={() => void exportPlanningPDF({ entreprise: entrepriseActive, planning, calculerHeures })}><Text style={styles.ongletTexte}>⇩ Export PDF</Text></Pressable>}</View>
    <View style={styles.selecteur}><Pressable style={styles.fleche} onPress={() => changerMois(-1)}><Text style={styles.flecheTexte}>‹</Text></Pressable><Text style={styles.mois}>{MOIS[mois - 1]} {annee}</Text><Pressable style={styles.fleche} onPress={() => changerMois(1)}><Text style={styles.flecheTexte}>›</Text></Pressable></View>

    {!planning ? <View style={styles.vide}><Text style={styles.secondaire}>Aucun planning généré pour cette période.</Text><Pressable style={styles.principal} onPress={() => void genererPlanningMois(mois, annee)}><Text style={styles.principalTexte}>Générer le planning du mois</Text></Pressable></View> : <>
      <View style={styles.etat}><Text style={[styles.badge, planning.statut === "VALIDE" && styles.badgeValide]}>{planning.statut}</Text>{planning.statut === "BROUILLON" ? <Pressable style={styles.valider} onPress={confirmerValidation}><Text style={styles.validerTexte}>Valider le mois</Text></Pressable> : <Text style={styles.aide}>Mois verrouillé</Text>}</View>
      <TableauPlanning planning={planning} calculerHeures={calculerHeures} onModifierJour={ouvrirEdition} />
    </>}

    {planning && ligneEdition && edition && <View style={styles.editeur}><Text style={styles.editeurTitre}>{ligneEdition.nom}</Text><Text style={styles.editeurDate}>{new Date(`${edition.jour.date}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Text>
      <Text style={styles.label}>Service matin</Text><View style={styles.horaires}><Heure value={edition.jour.matin.heureDebut} placeholder="Début" onChangeText={(valeur) => setEdition({ ...edition, jour: { ...edition.jour, matin: { ...edition.jour.matin, heureDebut: valeur } } })} /><Heure value={edition.jour.matin.heureFin} placeholder="Fin" onChangeText={(valeur) => setEdition({ ...edition, jour: { ...edition.jour, matin: { ...edition.jour.matin, heureFin: valeur } } })} /></View>
      <Text style={styles.label}>Service soir</Text><View style={styles.horaires}><Heure value={edition.jour.soir.heureDebut} placeholder="Début" onChangeText={(valeur) => setEdition({ ...edition, jour: { ...edition.jour, soir: { ...edition.jour.soir, heureDebut: valeur } } })} /><Heure value={edition.jour.soir.heureFin} placeholder="Fin" onChangeText={(valeur) => setEdition({ ...edition, jour: { ...edition.jour, soir: { ...edition.jour.soir, heureFin: valeur } } })} /></View>
      <Text style={styles.label}>Remarque ou exception</Text><View style={styles.remarques}>{REMARQUES_PLANNING.map((remarque) => <Pressable key={remarque} style={[styles.puce, edition.jour.remarque === remarque && styles.puceActive]} onPress={() => appliquerRemarque(remarque)}><Text style={styles.puceTexte}>{remarque}</Text></Pressable>)}</View>
      {(edition.jour.remarque === "Autre" || edition.jour.remarque === "Heure supplémentaire") && <TextInput style={styles.commentaire} value={edition.jour.remarqueLibre ?? ""} onChangeText={(remarqueLibre) => setEdition({ ...edition, jour: { ...edition.jour, remarqueLibre } })} placeholder="Formation, retour arrêt, précision…" placeholderTextColor="#817660" />}
      <View style={styles.actions}><Pressable style={styles.annuler} onPress={() => setEdition(undefined)}><Text style={styles.annulerTexte}>Annuler</Text></Pressable><Pressable style={styles.principalPetit} onPress={() => void enregistrer()}><Text style={styles.principalTexte}>Enregistrer</Text></Pressable></View>
    </View>}
  </ScrollView></SafeAreaView>;
}

function Heure({ value, placeholder, onChangeText }: { value: string; placeholder: string; onChangeText: (valeur: string) => void }) { return <TextInput style={styles.heure} value={value} onChangeText={onChangeText} placeholder={`${placeholder} HH:MM`} placeholderTextColor="#817660" maxLength={5} keyboardType="numbers-and-punctuation" />; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 16, gap: 14, paddingBottom: 55 }, surtitre: { color: "#8e6b25", textAlign: "center", letterSpacing: 3, fontSize: 10 }, titre: { color: "#f2d67f", fontSize: 28, fontWeight: "900", textAlign: "center" }, navigationModule: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }, onglet: { minHeight: 44, borderWidth: 1, borderColor: "#675127", borderRadius: 10, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, ongletActif: { backgroundColor: "#a57725", borderColor: "#c99a3b" }, ongletTexte: { color: "#dfc983", fontWeight: "800", fontSize: 12 }, ongletActifTexte: { color: "#090806", fontWeight: "900", fontSize: 12 }, selecteur: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 }, fleche: { width: 46, height: 46, borderWidth: 1, borderColor: "#70561f", borderRadius: 11, alignItems: "center", justifyContent: "center" }, flecheTexte: { color: "#e6c76f", fontSize: 29 }, mois: { color: "#eee1c1", fontSize: 19, fontWeight: "900", minWidth: 170, textAlign: "center" }, vide: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#604a21", borderRadius: 14, padding: 20, gap: 15, alignItems: "center" }, secondaire: { color: "#a99d84" }, principal: { minHeight: 52, backgroundColor: "#a97a26", borderRadius: 11, paddingHorizontal: 17, alignItems: "center", justifyContent: "center" }, principalPetit: { minHeight: 48, backgroundColor: "#a97a26", borderRadius: 10, paddingHorizontal: 15, alignItems: "center", justifyContent: "center" }, principalTexte: { color: "#090806", fontWeight: "900" }, etat: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, badge: { color: "#d9ba64", borderWidth: 1, borderColor: "#71551f", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, fontWeight: "900", fontSize: 10 }, badgeValide: { color: "#81cc93", borderColor: "#477a50" }, aide: { color: "#938975", fontSize: 12 }, valider: { minHeight: 42, backgroundColor: "#2f653c", borderRadius: 9, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, validerTexte: { color: "#e2f3e6", fontWeight: "900", fontSize: 12 }, editeur: { backgroundColor: "#18150f", borderWidth: 1, borderColor: "#a17728", borderRadius: 15, padding: 15, gap: 11 }, editeurTitre: { color: "#f0d587", fontSize: 20, fontWeight: "900" }, editeurDate: { color: "#bbae92", textTransform: "capitalize" }, label: { color: "#d8c79e", fontWeight: "800" }, horaires: { flexDirection: "row", gap: 8 }, heure: { flex: 1, minHeight: 50, backgroundColor: "#252118", borderWidth: 1, borderColor: "#51452e", borderRadius: 10, color: "#f8e9c1", paddingHorizontal: 11 }, remarques: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, puce: { borderWidth: 1, borderColor: "#66583d", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 }, puceActive: { backgroundColor: "#77591d", borderColor: "#c3973a" }, puceTexte: { color: "#ead89e", fontSize: 12 }, commentaire: { minHeight: 50, backgroundColor: "#252118", borderWidth: 1, borderColor: "#51452e", borderRadius: 10, color: "#f8e9c1", paddingHorizontal: 11 }, actions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 }, annuler: { minHeight: 48, borderWidth: 1, borderColor: "#735b2c", borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, annulerTexte: { color: "#dec985", fontWeight: "800" } });
