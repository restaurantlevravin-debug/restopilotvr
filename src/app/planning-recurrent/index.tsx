import { Redirect, router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { usePlanning } from "@/context/PlanningContext";
import { useUser } from "@/context/UserContext";
import type { JourPlanning } from "@/types/planning";
import { JOURS_SEMAINE_PLANNING, type JourSemainePlanning, type PlanningRecurrence } from "@/types/planningRecurrence";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOUR_VIDE: JourPlanning = { date: "", matin: { heureDebut: "", heureFin: "" }, soir: { heureDebut: "", heureFin: "" } };

export default function PlanningRecurrentScreen() {
  const { utilisateurActif, utilisateurs } = useUser();
  const { creerModelePlanning, modifierModelePlanning, genererPlanningMois, obtenirModeleEntreprise } = usePlanning();
  const maintenant = new Date();
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [edition, setEdition] = useState<PlanningRecurrence>();
  if (utilisateurActif?.role !== "GERANT") return <Redirect href="/" />;

  const modeles = obtenirModeleEntreprise();
  const disponibles = utilisateurs.filter((u) => u.actif && u.role !== "GERANT" && !modeles.some((m) => m.utilisateurId === u.id));

  async function ajouterModele(utilisateurId: string) {
    const utilisateur = utilisateurs.find((u) => u.id === utilisateurId);
    if (!utilisateur) return;
    const nouveau = await creerModelePlanning({ utilisateurId, poste: utilisateur.poste ?? "", semaine: {}, actif: true });
    if (nouveau) setEdition(nouveau);
  }

  function modifierJour(jour: JourSemainePlanning, champ: "matinDebut" | "matinFin" | "soirDebut" | "soirFin", valeur: string) {
    if (!edition) return;
    const actuel = edition.semaine[jour] ?? JOUR_VIDE;
    const modifie: JourPlanning = {
      ...actuel,
      matin: { ...actuel.matin },
      soir: { ...actuel.soir },
    };
    if (champ === "matinDebut") modifie.matin.heureDebut = valeur;
    if (champ === "matinFin") modifie.matin.heureFin = valeur;
    if (champ === "soirDebut") modifie.soir.heureDebut = valeur;
    if (champ === "soirFin") modifie.soir.heureFin = valeur;
    setEdition({ ...edition, semaine: { ...edition.semaine, [jour]: modifie } });
  }

  function mettreRepos(jour: JourSemainePlanning) {
    if (!edition) return;
    const actuel = edition.semaine[jour];
    setEdition({ ...edition, semaine: { ...edition.semaine, [jour]: actuel?.remarque === "Repos" ? undefined : { ...JOUR_VIDE, remarque: "Repos" } } });
  }

  async function enregistrerModele() {
    if (!edition) return;
    const horaireValide = (debut: string, fin: string) => (!debut && !fin) || (/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(debut) && /^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(fin));
    const valide = Object.values(edition.semaine).every((jour) => !jour || (horaireValide(jour.matin.heureDebut, jour.matin.heureFin) && horaireValide(jour.soir.heureDebut, jour.soir.heureFin)));
    if (!valide) { Alert.alert("Horaires incomplets", "Utilisez le format HH:MM avec un début et une fin."); return; }
    const succes = await modifierModelePlanning(edition.id, { poste: edition.poste, semaine: edition.semaine, actif: edition.actif });
    if (succes) setEdition(undefined);
  }

  async function generer() {
    const planning = await genererPlanningMois(mois, annee);
    if (!planning) { Alert.alert("Génération impossible", "Vérifiez le mois et votre entreprise."); return; }
    Alert.alert("Planning prêt", `${MOIS[mois - 1]} ${annee} a été généré.`, [{ text: "Ouvrir", onPress: () => router.push("/planning/gestion" as Href) }]);
  }

  function changerMois(delta: number) { const date = new Date(annee, mois - 1 + delta, 1); setMois(date.getMonth() + 1); setAnnee(date.getFullYear()); }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
    <Text style={styles.surtitre}>ORGANISATION HABITUELLE</Text><Text style={styles.titre}>Planning récurrent</Text>
    <View style={styles.generation}><Text style={styles.sectionTitre}>Générer le planning du mois</Text><View style={styles.navigation}><Pressable style={styles.fleche} onPress={() => changerMois(-1)}><Text style={styles.flecheTexte}>‹</Text></Pressable><Text style={styles.mois}>{MOIS[mois - 1]} {annee}</Text><Pressable style={styles.fleche} onPress={() => changerMois(1)}><Text style={styles.flecheTexte}>›</Text></Pressable></View><Pressable style={styles.principal} onPress={() => void generer()}><Text style={styles.principalTexte}>Générer le planning</Text></Pressable></View>

    <Text style={styles.sectionTitre}>Ajouter un modèle</Text>
    {disponibles.length === 0 ? <Text style={styles.secondaire}>Tous les salariés actifs possèdent un modèle.</Text> : <ScrollView horizontal contentContainerStyle={styles.listeEmployes}>{disponibles.map((u) => <Pressable key={u.id} style={styles.employe} onPress={() => void ajouterModele(u.id)}><Text style={styles.employeNom}>＋ {u.nom}</Text><Text style={styles.secondaire}>{u.poste ?? "Poste non renseigné"}</Text></Pressable>)}</ScrollView>}

    <Text style={styles.sectionTitre}>Équipe habituelle</Text>
    {modeles.length === 0 ? <View style={styles.carte}><Text style={styles.secondaire}>Aucun modèle récurrent.</Text></View> : modeles.map((modele) => <Pressable key={modele.id} style={styles.carte} onPress={() => setEdition({ ...modele, semaine: { ...modele.semaine } })}><View style={styles.entete}><View><Text style={styles.nom}>{utilisateurs.find((u) => u.id === modele.utilisateurId)?.nom ?? "Salarié"}</Text><Text style={styles.poste}>{modele.poste || "Poste non renseigné"}</Text></View><Text style={styles.badge}>{modele.actif ? "ACTIF" : "INACTIF"}</Text></View><ScrollView horizontal><View style={styles.semaineResume}>{JOURS_SEMAINE_PLANNING.map((jour) => { const donnees = modele.semaine[jour]; return <View key={jour} style={styles.jourResume}><Text style={styles.jourNom}>{jour.slice(0, 3).toUpperCase()}</Text><Text style={styles.horaire}>{donnees?.remarque === "Repos" ? "Repos" : donnees?.matin.heureDebut ? `${donnees.matin.heureDebut}-${donnees.matin.heureFin}` : donnees?.soir.heureDebut ? `${donnees.soir.heureDebut}-${donnees.soir.heureFin}` : "—"}</Text></View>; })}</View></ScrollView></Pressable>)}

    {edition && <View style={styles.editeur}><Text style={styles.sectionTitre}>{utilisateurs.find((u) => u.id === edition.utilisateurId)?.nom}</Text><TextInput style={styles.input} value={edition.poste} onChangeText={(poste) => setEdition({ ...edition, poste })} placeholder="Poste" placeholderTextColor="#81765f" />{JOURS_SEMAINE_PLANNING.map((jour) => { const donnees = edition.semaine[jour] ?? JOUR_VIDE; const repos = donnees.remarque === "Repos"; return <View key={jour} style={styles.jourEdition}><View style={styles.enteteJour}><Text style={styles.jourComplet}>{jour}</Text><Pressable style={[styles.repos, repos && styles.reposActif]} onPress={() => mettreRepos(jour)}><Text style={styles.reposTexte}>Repos</Text></Pressable></View>{!repos && <><Text style={styles.label}>Midi</Text><View style={styles.horaires}><Heure value={donnees.matin.heureDebut} placeholder="11:30" onChangeText={(v) => modifierJour(jour, "matinDebut", v)} /><Heure value={donnees.matin.heureFin} placeholder="15:00" onChangeText={(v) => modifierJour(jour, "matinFin", v)} /></View><Text style={styles.label}>Soir</Text><View style={styles.horaires}><Heure value={donnees.soir.heureDebut} placeholder="19:00" onChangeText={(v) => modifierJour(jour, "soirDebut", v)} /><Heure value={donnees.soir.heureFin} placeholder="23:00" onChangeText={(v) => modifierJour(jour, "soirFin", v)} /></View></>}</View>; })}<View style={styles.actions}><Pressable style={styles.secondaireBouton} onPress={() => setEdition(undefined)}><Text style={styles.secondaireTexte}>Annuler</Text></Pressable><Pressable style={styles.principalPetit} onPress={() => void enregistrerModele()}><Text style={styles.principalTexte}>Enregistrer le modèle</Text></Pressable></View></View>}
  </ScrollView></SafeAreaView>;
}

function Heure({ value, placeholder, onChangeText }: { value: string; placeholder: string; onChangeText: (v: string) => void }) { return <TextInput style={styles.heureInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#776d58" maxLength={5} keyboardType="numbers-and-punctuation" />; }
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 17, gap: 14, paddingBottom: 55 }, surtitre: { color: "#8e6b25", textAlign: "center", letterSpacing: 3, fontSize: 10 }, titre: { color: "#f2d67f", fontSize: 28, fontWeight: "900", textAlign: "center" }, generation: { backgroundColor: "#1a160f", borderWidth: 1, borderColor: "#9b7225", borderRadius: 15, padding: 15, gap: 12 }, sectionTitre: { color: "#eed181", fontSize: 19, fontWeight: "900" }, navigation: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 15 }, fleche: { width: 44, height: 44, borderWidth: 1, borderColor: "#715720", borderRadius: 11, alignItems: "center", justifyContent: "center" }, flecheTexte: { color: "#e7c86e", fontSize: 28 }, mois: { color: "#ece0c2", fontWeight: "800", minWidth: 160, textAlign: "center" }, principal: { minHeight: 52, backgroundColor: "#aa7c27", borderRadius: 11, alignItems: "center", justifyContent: "center" }, principalPetit: { minHeight: 48, backgroundColor: "#aa7c27", borderRadius: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center" }, principalTexte: { color: "#090806", fontWeight: "900" }, listeEmployes: { gap: 9 }, employe: { minWidth: 175, backgroundColor: "#191610", borderWidth: 1, borderColor: "#5d4924", borderRadius: 12, padding: 13 }, employeNom: { color: "#ead18b", fontWeight: "800" }, secondaire: { color: "#a99d86" }, carte: { backgroundColor: "#16140f", borderWidth: 1, borderColor: "#634c20", borderRadius: 14, padding: 14, gap: 11 }, entete: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, nom: { color: "#f0dfb5", fontSize: 18, fontWeight: "900" }, poste: { color: "#b2a58b" }, badge: { color: "#d4b75f", fontSize: 10, fontWeight: "900" }, semaineResume: { flexDirection: "row", gap: 5 }, jourResume: { width: 78, backgroundColor: "#252118", borderRadius: 8, padding: 7 }, jourNom: { color: "#c7aa59", fontSize: 10, fontWeight: "900" }, horaire: { color: "#e5dac0", fontSize: 10, marginTop: 3 }, editeur: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#a17829", borderRadius: 15, padding: 15, gap: 12 }, input: { minHeight: 50, backgroundColor: "#252118", borderWidth: 1, borderColor: "#52462f", borderRadius: 10, color: "#f8e9c1", paddingHorizontal: 12 }, jourEdition: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#51432a", paddingTop: 11, gap: 7 }, enteteJour: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, jourComplet: { color: "#e7cf8b", fontSize: 16, fontWeight: "900", textTransform: "capitalize" }, repos: { borderWidth: 1, borderColor: "#66593e", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }, reposActif: { backgroundColor: "#78591e" }, reposTexte: { color: "#ead89e", fontWeight: "700", fontSize: 12 }, label: { color: "#a99d84", fontSize: 11 }, horaires: { flexDirection: "row", gap: 8 }, heureInput: { flex: 1, minHeight: 45, backgroundColor: "#242018", borderRadius: 9, borderWidth: 1, borderColor: "#4e432e", color: "#f5e5bd", paddingHorizontal: 11 }, actions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 8 }, secondaireBouton: { minHeight: 48, borderWidth: 1, borderColor: "#735b2d", borderRadius: 10, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" }, secondaireTexte: { color: "#dfc985", fontWeight: "800" } });
