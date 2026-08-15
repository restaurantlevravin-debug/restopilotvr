import { Redirect, router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { useUser } from "@/context/UserContext";
import { exportPlanningPDF } from "@/services/planningPdfService";
import { REMARQUES_PLANNING, type JourPlanning, type LignePlanningMensuel, type RemarquePlanning } from "@/types/planning";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
type Selection = { utilisateurId: string; date: string };

export default function PlanningGerantScreen() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif } = useUser();
  const { creerPlanning, modifierPlanning, validerPlanning, obtenirPlanningEntreprise, calculerHeures } = usePlanning();
  const maintenant = new Date();
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [selection, setSelection] = useState<Selection>();
  const [edition, setEdition] = useState<JourPlanning>();
  const [contrat, setContrat] = useState("");
  if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return <Redirect href="/" />;

  const planning = obtenirPlanningEntreprise(mois, annee);
  const ligneSelectionnee = planning?.lignes.find((ligne) => ligne.utilisateurId === selection?.utilisateurId);

  function changerMois(delta: number) {
    const date = new Date(annee, mois - 1 + delta, 1);
    setMois(date.getMonth() + 1); setAnnee(date.getFullYear()); setSelection(undefined); setEdition(undefined);
  }

  function ouvrirJour(ligne: LignePlanningMensuel, jour: JourPlanning) {
    if (planning?.statut === "VALIDE") return;
    setSelection({ utilisateurId: ligne.utilisateurId, date: jour.date });
    setEdition({ ...jour, matin: { ...jour.matin }, soir: { ...jour.soir } });
    setContrat(String(ligne.heuresContratHebdomadaires || ""));
  }

  async function enregistrerJour() {
    if (!planning || !selection || !edition) return;
    const periodeValide = (debut: string, fin: string) =>
      (!debut && !fin)
      || (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(debut) && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(fin));
    if (!periodeValide(edition.matin.heureDebut, edition.matin.heureFin) || !periodeValide(edition.soir.heureDebut, edition.soir.heureFin)) {
      Alert.alert("Horaires incomplets", "Renseignez un début et une fin au format HH:MM pour chaque service travaillé.");
      return;
    }
    const heuresContrat = Number(contrat.replace(",", "."));
    if (Number.isNaN(heuresContrat) || heuresContrat < 0) { Alert.alert("Contrat incorrect", "Saisissez un nombre d'heures valide."); return; }
    const lignes = planning.lignes.map((ligne) => ligne.utilisateurId === selection.utilisateurId ? {
      ...ligne,
      heuresContratHebdomadaires: heuresContrat,
      jours: ligne.jours.map((jour) => jour.date === selection.date ? edition : jour),
    } : ligne);
    const succes = await modifierPlanning(planning.id, { lignes });
    if (succes) { setSelection(undefined); setEdition(undefined); }
  }

  function confirmerValidation() {
    if (!planning) return;
    Alert.alert("Valider le mois ?", "Le planning deviendra non modifiable.", [
      { text: "Annuler", style: "cancel" },
      { text: "Valider", onPress: () => void validerPlanning(planning.id) },
    ]);
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
    <Text style={styles.surtitre}>GESTION ENTREPRISE</Text><Text style={styles.titre}>Planning mensuel</Text>
    <Pressable style={styles.secondaireBouton} onPress={() => router.push("/planning-recurrent" as Href)}><Text style={styles.secondaireBoutonTexte}>↻ Planning récurrent</Text></Pressable>
    <View style={styles.navigation}><Pressable style={styles.fleche} onPress={() => changerMois(-1)}><Text style={styles.flecheTexte}>‹</Text></Pressable><Text style={styles.mois}>{MOIS[mois - 1]} {annee}</Text><Pressable style={styles.fleche} onPress={() => changerMois(1)}><Text style={styles.flecheTexte}>›</Text></Pressable></View>

    {!planning ? <View style={styles.vide}><Text style={styles.secondaire}>Aucun planning pour ce mois.</Text><Pressable style={styles.principal} onPress={() => void creerPlanning(mois, annee)}><Text style={styles.principalTexte}>Créer le planning</Text></Pressable></View> : <>
      <View style={styles.barre}><Text style={[styles.badge, planning.statut === "VALIDE" && styles.badgeValide]}>{planning.statut}</Text><View style={styles.actions}><Pressable style={styles.secondaireBouton} onPress={() => void exportPlanningPDF({ entreprise: entrepriseActive, planning, calculerHeures })}><Text style={styles.secondaireBoutonTexte}>PDF comptable</Text></Pressable>{planning.statut === "BROUILLON" && <Pressable style={styles.principalPetit} onPress={confirmerValidation}><Text style={styles.principalTexte}>Valider le mois</Text></Pressable>}</View></View>
      <ScrollView horizontal style={styles.tableau} contentContainerStyle={styles.tableauContenu}>
        <View><View style={styles.enteteLigne}><Text style={[styles.celluleFixe, styles.enteteTexte]}>Salarié / poste</Text>{planning.lignes[0]?.jours.map((jour) => <Text key={jour.date} style={[styles.celluleJour, styles.enteteTexte]}>{Number(jour.date.slice(-2))}</Text>)}<Text style={[styles.celluleTotal, styles.enteteTexte]}>Total</Text></View>
          {planning.lignes.map((ligne) => { const calcul = calculerHeures(ligne); return <View key={ligne.utilisateurId} style={styles.ligneTableau}><View style={styles.celluleFixe}><Text style={styles.nom}>{ligne.nom}</Text><Text style={styles.poste}>{ligne.poste || "Poste à renseigner"}</Text><Text style={styles.contrat}>{ligne.heuresContratHebdomadaires || 0} h/sem.</Text></View>{ligne.jours.map((jour) => <Pressable key={jour.date} style={styles.celluleJour} onPress={() => ouvrirJour(ligne, jour)}><Text style={styles.horaireMini}>{jour.matin.heureDebut ? `${jour.matin.heureDebut}-${jour.matin.heureFin}` : "—"}</Text><Text style={styles.horaireMini}>{jour.soir.heureDebut ? `${jour.soir.heureDebut}-${jour.soir.heureFin}` : "—"}</Text><Text numberOfLines={1} style={styles.remarqueMini}>{jour.remarque ?? ""}</Text></Pressable>)}<View style={styles.celluleTotal}><Text style={styles.brut}>{calcul.heuresPrevues} h brut</Text><Text style={styles.total}>{calcul.heuresCalculees} h net</Text><Text style={calcul.ecartContrat >= 0 ? styles.plus : styles.moins}>{calcul.ecartContrat >= 0 ? "+" : ""}{calcul.ecartContrat} h</Text></View></View>; })}
        </View>
      </ScrollView>
    </>}

    {planning && ligneSelectionnee && edition && <View style={styles.editeur}><Text style={styles.editeurTitre}>{ligneSelectionnee.nom} · {edition.date}</Text><Text style={styles.label}>Contrat hebdomadaire</Text><TextInput style={styles.input} value={contrat} onChangeText={setContrat} keyboardType="decimal-pad" placeholder="Heures/semaine" placeholderTextColor="#82765e" /><Text style={styles.label}>Service matin</Text><View style={styles.deuxInputs}><HeureInput placeholder="Début" value={edition.matin.heureDebut} onChangeText={(v) => setEdition({ ...edition, matin: { ...edition.matin, heureDebut: v } })} /><HeureInput placeholder="Fin" value={edition.matin.heureFin} onChangeText={(v) => setEdition({ ...edition, matin: { ...edition.matin, heureFin: v } })} /></View><Text style={styles.label}>Service soir</Text><View style={styles.deuxInputs}><HeureInput placeholder="Début" value={edition.soir.heureDebut} onChangeText={(v) => setEdition({ ...edition, soir: { ...edition.soir, heureDebut: v } })} /><HeureInput placeholder="Fin" value={edition.soir.heureFin} onChangeText={(v) => setEdition({ ...edition, soir: { ...edition.soir, heureFin: v } })} /></View><Text style={styles.label}>Remarque</Text><View style={styles.remarques}>{REMARQUES_PLANNING.map((remarque) => <Pressable key={remarque} style={[styles.puce, edition.remarque === remarque && styles.puceActive]} onPress={() => setEdition({ ...edition, remarque: edition.remarque === remarque ? undefined : remarque })}><Text style={styles.puceTexte}>{remarque}</Text></Pressable>)}</View>{edition.remarque === "Autre" && <TextInput style={styles.input} value={edition.remarqueLibre ?? ""} onChangeText={(v) => setEdition({ ...edition, remarqueLibre: v })} placeholder="Préciser" placeholderTextColor="#82765e" />}<View style={styles.actions}><Pressable style={styles.secondaireBouton} onPress={() => { setSelection(undefined); setEdition(undefined); }}><Text style={styles.secondaireBoutonTexte}>Annuler</Text></Pressable><Pressable style={styles.principalPetit} onPress={() => void enregistrerJour()}><Text style={styles.principalTexte}>Enregistrer</Text></Pressable></View></View>}
  </ScrollView></SafeAreaView>;
}

function HeureInput({ placeholder, value, onChangeText }: { placeholder: string; value: string; onChangeText: (v: string) => void }) { return <TextInput style={[styles.input, styles.inputHeure]} value={value} onChangeText={onChangeText} placeholder={`${placeholder} HH:MM`} placeholderTextColor="#82765e" keyboardType="numbers-and-punctuation" maxLength={5} />; }

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 16, gap: 14, paddingBottom: 50 }, surtitre: { color: "#8c6a26", textAlign: "center", letterSpacing: 3, fontSize: 10 }, titre: { color: "#f2d67f", fontSize: 28, fontWeight: "900", textAlign: "center" }, navigation: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 20 }, fleche: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: "#725822", alignItems: "center", justifyContent: "center" }, flecheTexte: { color: "#e9ca73", fontSize: 30 }, mois: { color: "#eee1c1", fontSize: 19, fontWeight: "800", minWidth: 170, textAlign: "center" }, vide: { backgroundColor: "#16140f", borderWidth: 1, borderColor: "#604a22", borderRadius: 15, padding: 20, gap: 16, alignItems: "center" }, secondaire: { color: "#a99d84" }, principal: { minHeight: 54, backgroundColor: "#a97b27", borderRadius: 11, paddingHorizontal: 20, alignItems: "center", justifyContent: "center" }, principalPetit: { minHeight: 46, backgroundColor: "#a97b27", borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, principalTexte: { color: "#090806", fontWeight: "900" }, barre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }, badge: { color: "#d6b85e", borderWidth: 1, borderColor: "#765820", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, fontWeight: "800", fontSize: 11 }, badgeValide: { color: "#8bd19b", borderColor: "#477b50" }, actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: 8 }, secondaireBouton: { minHeight: 46, borderWidth: 1, borderColor: "#765d2c", borderRadius: 10, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, secondaireBoutonTexte: { color: "#e5cd87", fontWeight: "800" }, tableau: { borderRadius: 12, borderWidth: 1, borderColor: "#52401e" }, tableauContenu: { backgroundColor: "#11100d" }, enteteLigne: { flexDirection: "row", backgroundColor: "#241d11" }, ligneTableau: { flexDirection: "row", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#514329" }, celluleFixe: { width: 155, minHeight: 76, padding: 8, justifyContent: "center", borderRightWidth: 1, borderRightColor: "#514329" }, celluleJour: { width: 92, minHeight: 76, padding: 5, justifyContent: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "#403724" }, celluleTotal: { width: 100, minHeight: 76, padding: 7, justifyContent: "center", alignItems: "center" }, enteteTexte: { color: "#e1c46f", minHeight: 42, fontWeight: "900", textAlign: "center" }, nom: { color: "#f0e3c3", fontWeight: "800" }, poste: { color: "#a99c82", fontSize: 12 }, contrat: { color: "#cfb56e", fontSize: 11 }, horaireMini: { color: "#e5d9ba", fontSize: 11, textAlign: "center" }, remarqueMini: { color: "#b68e3c", fontSize: 9, textAlign: "center" }, brut: { color: "#a99d84", fontSize: 10 }, total: { color: "#efd274", fontWeight: "900" }, plus: { color: "#79c98d", fontSize: 11 }, moins: { color: "#e48477", fontSize: 11 }, editeur: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#a07629", borderRadius: 15, padding: 15, gap: 11 }, editeurTitre: { color: "#f1d486", fontSize: 19, fontWeight: "900" }, label: { color: "#d8c89f", fontWeight: "700" }, input: { minHeight: 50, backgroundColor: "#242018", borderWidth: 1, borderColor: "#51452f", borderRadius: 10, color: "#fff0c7", paddingHorizontal: 12 }, deuxInputs: { flexDirection: "row", gap: 9 }, inputHeure: { flex: 1 }, remarques: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, puce: { borderWidth: 1, borderColor: "#66583d", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8 }, puceActive: { backgroundColor: "#765719", borderColor: "#c5993d" }, puceTexte: { color: "#ead89e", fontSize: 12 } });
