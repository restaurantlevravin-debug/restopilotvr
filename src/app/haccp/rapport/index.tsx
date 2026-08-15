import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useAnomaliesHaccp } from "@/context/AnomalieHaccpContext";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useHaccp } from "@/context/HaccpContext";
import { useRewards } from "@/context/RewardContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import { exporterRapportPDF, genererRapportHaccp, obtenirHistoriqueRapport, obtenirSyntheseEntreprise } from "@/services/rapportHaccpService";

function dateAujourdhui() { return new Date().toISOString().slice(0, 10); }

export default function RapportHaccpScreen() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, utilisateurs } = useUser();
  const { controlesRealises, pointsControle } = useHaccp();
  const { anomalies } = useAnomaliesHaccp();
  const { validations } = useValidation();
  const { profilImperial } = useRewards();
  const [debut, setDebut] = useState(dateAujourdhui());
  const [fin, setFin] = useState(dateAujourdhui());
  const [periode, setPeriode] = useState({ debut: dateAujourdhui(), fin: dateAujourdhui() });

  if (!entrepriseActive || utilisateurActif?.role !== "GERANT") return <Redirect href="/haccp" />;

  const sources = { entreprise: entrepriseActive, periode, controles: controlesRealises, pointsControle, anomalies, validations, niveauEquipe: profilImperial?.grade };
  const rapport = genererRapportHaccp(sources);
  const synthese = obtenirSyntheseEntreprise(sources);
  const historique = obtenirHistoriqueRapport(sources);
  const nonConformes = rapport.statistiques.nombreControles - rapport.statistiques.controlesConformes;
  const critiqueOuverte = anomalies.some((a) => a.entrepriseId === entrepriseActive.id && a.statut !== "CLOTUREE" && a.priorite === "CRITIQUE");
  const indicateur = critiqueOuverte ? { icone: "🔴", texte: "Action nécessaire" } : rapport.statistiques.anomaliesOuvertes > 0 || nonConformes > 0 ? { icone: "🟠", texte: "Surveillance" } : { icone: "🟢", texte: "Conforme" };

  function appliquerPeriode() {
    if (/^\d{4}-\d{2}-\d{2}$/.test(debut) && /^\d{4}-\d{2}-\d{2}$/.test(fin) && debut <= fin) setPeriode({ debut, fin });
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu}>
    <View style={styles.hero}><Text style={styles.couronne}>👑</Text><Text style={styles.titre}>Rapport Impérial HACCP</Text><Text style={styles.entreprise}>{entrepriseActive.nom}</Text><Text style={styles.periode}>{periode.debut} — {periode.fin}</Text></View>
    <View style={styles.filtres}><TextInput style={styles.dateInput} value={debut} onChangeText={setDebut} placeholder="AAAA-MM-JJ" placeholderTextColor="#776d59" /><TextInput style={styles.dateInput} value={fin} onChangeText={setFin} placeholder="AAAA-MM-JJ" placeholderTextColor="#776d59" /><Pressable style={styles.appliquer} onPress={appliquerPeriode}><Text style={styles.appliquerTexte}>Actualiser</Text></Pressable></View>

    <View style={styles.score}><Text style={styles.sectionTitre}>Score conformité</Text><Text style={styles.scoreValeur}>{rapport.statistiques.tauxConformite}%</Text><Text style={styles.indicateur}>{indicateur.icone} {indicateur.texte}</Text></View>

    <Section titre="Contrôles réalisés"><View style={styles.grille}><Stat label="Total" valeur={rapport.statistiques.nombreControles} /><Stat label="Conformes" valeur={rapport.statistiques.controlesConformes} /><Stat label="Non conformes" valeur={nonConformes} /></View></Section>
    <Section titre="Anomalies"><View style={styles.grille}><Stat label="Ouvertes" valeur={rapport.statistiques.anomaliesOuvertes} /><Stat label="Résolues" valeur={rapport.statistiques.anomaliesResolues} /><Stat label="Résolution moyenne" valeur={`${synthese.tempsMoyenResolutionJours} j`} /></View></Section>

    <Section titre="Points de contrôle">{rapport.pointsControle.length === 0 ? <Text style={styles.secondaire}>Aucun passage sur la période.</Text> : rapport.pointsControle.map((point) => <View key={point.nom} style={styles.ligne}><View><Text style={styles.ligneTitre}>{point.nom}</Text><Text style={styles.secondaire}>{point.nombrePassages} passage(s)</Text></View><Text style={styles.pourcentage}>{point.conformite}%</Text></View>)}</Section>

    <Section titre="Responsables">{rapport.validations.length === 0 ? <Text style={styles.secondaire}>Aucune validation sur la période.</Text> : rapport.validations.map((validation) => <View key={`${validation.utilisateurId}-${validation.role}`} style={styles.ligne}><View><Text style={styles.ligneTitre}>{utilisateurs.find((u) => u.id === validation.utilisateurId)?.nom ?? "Responsable"}</Text><Text style={styles.secondaire}>{validation.role}</Text></View><Text style={styles.nombre}>{validation.nombreValidations}</Text></View>)}</Section>

    <Section titre="Historique">{historique.length === 0 ? <Text style={styles.secondaire}>Aucun contrôle sur la période.</Text> : historique.map((ligne) => <View key={ligne.id} style={styles.historique}><View style={styles.ligne}><Text style={styles.ligneTitre}>{ligne.controle}</Text><Text style={ligne.conforme ? styles.ok : styles.ko}>{ligne.conforme ? "CONFORME" : "ANOMALIE"}</Text></View><Text style={styles.resultat}>Résultat : {ligne.resultat}</Text><Text style={styles.secondaire}>{ligne.date} · {ligne.heure} · {utilisateurs.find((u) => u.id === ligne.utilisateurId)?.nom ?? "Utilisateur"}</Text><Text style={styles.validation}>Validation : {ligne.validation}</Text></View>)}</Section>

    <View style={styles.bilan}><Text style={styles.sectionTitre}>👑 Bilan Impérial du jour</Text><Text style={styles.bilanTexte}>{synthese.nombreControles} contrôles réalisés</Text><Text style={styles.bilanTexte}>{synthese.tauxConformite}% de conformité</Text><Text style={styles.bilanTexte}>{synthese.anomaliesTraitees} anomalies traitées</Text><Text style={styles.bilanTexte}>Équipe niveau {synthese.niveauEquipe}</Text></View>
    <Pressable style={styles.pdf} onPress={() => void exporterRapportPDF(rapport)}><Text style={styles.pdfTexte}>Export PDF — bientôt disponible</Text></Pressable>
  </ScrollView></SafeAreaView>;
}

function Section({ titre, children }: { titre: string; children: React.ReactNode }) { return <View style={styles.section}><Text style={styles.sectionTitre}>{titre}</Text>{children}</View>; }
function Stat({ label, valeur }: { label: string; valeur: string | number }) { return <View style={styles.stat}><Text style={styles.statValeur}>{valeur}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#080808" }, contenu: { padding: 18, gap: 14, paddingBottom: 50 }, hero: { alignItems: "center", backgroundColor: "#15120d", borderWidth: 1, borderColor: "#a27728", borderRadius: 18, padding: 22, gap: 5 }, couronne: { fontSize: 34 }, titre: { color: "#f4d579", fontSize: 27, fontWeight: "900", textAlign: "center" }, entreprise: { color: "#f0e4c5", fontSize: 18, fontWeight: "700" }, periode: { color: "#a99b7e" }, filtres: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, dateInput: { flex: 1, minWidth: 125, minHeight: 48, backgroundColor: "#201d17", borderWidth: 1, borderColor: "#52462f", borderRadius: 10, color: "#f6e8c2", paddingHorizontal: 11 }, appliquer: { minHeight: 48, backgroundColor: "#a77825", borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" }, appliquerTexte: { color: "#090806", fontWeight: "900" }, score: { alignItems: "center", backgroundColor: "#171510", borderRadius: 16, borderWidth: 1, borderColor: "#73571f", padding: 20, gap: 6 }, scoreValeur: { color: "#f6d56f", fontSize: 50, fontWeight: "900" }, indicateur: { color: "#e8dec5", fontSize: 17, fontWeight: "700" }, section: { backgroundColor: "#15130f", borderWidth: 1, borderColor: "#604a21", borderRadius: 15, padding: 15, gap: 11 }, sectionTitre: { color: "#f1d68d", fontSize: 19, fontWeight: "900" }, grille: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, stat: { flexGrow: 1, minWidth: 90, backgroundColor: "#211e17", borderRadius: 11, padding: 12 }, statValeur: { color: "#f5d77f", fontSize: 22, fontWeight: "900" }, statLabel: { color: "#a99d85", fontSize: 12 }, ligne: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, ligneTitre: { color: "#eee2c3", fontSize: 15, fontWeight: "700", flexShrink: 1 }, secondaire: { color: "#a79b84", fontSize: 13 }, pourcentage: { color: "#e7c66c", fontSize: 18, fontWeight: "900" }, nombre: { color: "#e7c66c", fontSize: 20, fontWeight: "900" }, historique: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#4e432e", paddingTop: 10, gap: 4 }, ok: { color: "#7fcf93", fontSize: 11, fontWeight: "900" }, ko: { color: "#ef8878", fontSize: 11, fontWeight: "900" }, resultat: { color: "#d8cbaa" }, validation: { color: "#c2ab6c", fontSize: 13 }, bilan: { backgroundColor: "#211a0e", borderWidth: 1, borderColor: "#b28229", borderRadius: 16, padding: 18, gap: 8 }, bilanTexte: { color: "#ede0bd", fontSize: 16 }, pdf: { minHeight: 52, borderWidth: 1, borderColor: "#745c2a", borderRadius: 11, alignItems: "center", justifyContent: "center", opacity: 0.7 }, pdfTexte: { color: "#cdb878", fontWeight: "700" } });
