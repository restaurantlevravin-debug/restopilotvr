import { Redirect, Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useEntreprise } from "@/context/EntrepriseContext";
import { PointagePadProvider } from "@/context/PointagePadContext";
import { useUser } from "@/context/UserContext";
import { ValidationHeuresProvider, useValidationHeures } from "@/context/ValidationHeuresContext";
import { exporterHeuresPDF } from "@/services/exportHeuresPDF";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function heures(minutes: number) { const signe = minutes < 0 ? "-" : ""; const valeur = Math.abs(minutes); return `${signe}${Math.floor(valeur / 60)}h${String(valeur % 60).padStart(2, "0")}`; }
function indicateur(ecart: number) { const valeur = Math.abs(ecart); return valeur <= 60 ? "🟢 Conforme" : valeur <= 180 ? "🟠 Écart à vérifier" : "🔴 Écart important"; }

function Contenu() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurs } = useUser();
  const { creerValidationMensuelle, obtenirValidationMensuelle, obtenirSyntheseMois, ajouterRemarque, validerHeuresMois } = useValidationHeures();
  const maintenant = new Date();
  const [mois, setMois] = useState(maintenant.getMonth() + 1);
  const [annee, setAnnee] = useState(maintenant.getFullYear());
  const [remarques, setRemarques] = useState<Record<string, string>>({});
  const validation = obtenirValidationMensuelle(mois, annee);
  const synthese = obtenirSyntheseMois(mois, annee);

  useEffect(() => { if (!validation) void creerValidationMensuelle(mois, annee); }, [annee, mois, validation]);
  useEffect(() => { setRemarques(validation?.remarques ?? {}); }, [validation?.id, validation?.remarques]);

  const validateur = useMemo(() => utilisateurs.find((utilisateur) => utilisateur.id === validation?.validePar), [utilisateurs, validation?.validePar]);
  function changerMois(delta: number) { let prochain = mois + delta; let prochaineAnnee = annee; if (prochain === 0) { prochain = 12; prochaineAnnee--; } if (prochain === 13) { prochain = 1; prochaineAnnee++; } setMois(prochain); setAnnee(prochaineAnnee); }
  async function enregistrerRemarques() { if (!synthese) return; await Promise.all(synthese.lignes.map((ligne) => ajouterRemarque(mois, annee, ligne.utilisateurId, remarques[ligne.utilisateurId] ?? ""))); Alert.alert("Remarques enregistrées"); }
  function demanderValidation() { Alert.alert("Valider le mois ?", "Cette validation humaine figera les remarques du mois.", [{ text: "Annuler", style: "cancel" }, { text: "Valider", onPress: async () => { await enregistrerRemarques(); if (await validerHeuresMois(mois, annee)) Alert.alert("🎉 Mois validé par l’Empire"); } }]); }
  async function exporter() { if (!entrepriseActive || !validation || !synthese) return; try { await exporterHeuresPDF({ entreprise: entrepriseActive, validation, synthese }); } catch { Alert.alert("Export impossible", "Le PDF n’a pas pu être généré."); } }

  return <SafeAreaView style={styles.ecran}><Stack.Screen options={{ headerShown: false }} /><View style={styles.entete}><Pressable onPress={() => router.back()}><Text style={styles.retour}>‹ Retour</Text></Pressable><Text style={styles.surtitre}>👑 VALIDATION DES HEURES</Text><Text style={styles.titre}>{MOIS[mois - 1]} {annee}</Text><View style={styles.navigation}><Pressable style={styles.boutonSecondaire} onPress={() => changerMois(-1)}><Text style={styles.boutonSecondaireTexte}>Mois précédent</Text></Pressable><Pressable style={styles.boutonSecondaire} onPress={() => changerMois(1)}><Text style={styles.boutonSecondaireTexte}>Mois suivant</Text></Pressable></View></View><ScrollView contentContainerStyle={styles.contenu}>
    {!synthese ? <View style={styles.carte}><Text style={styles.vide}>Aucun planning mensuel disponible pour cette période.</Text></View> : <>
      <View style={styles.carte}><Text style={styles.statut}>Statut : {validation?.statut ?? "EN_COURS"}</Text><View style={styles.totaux}><Text style={styles.total}>Prévues {heures(synthese.totalPrevuMinutes)}</Text><Text style={styles.total}>Réalisées {heures(synthese.totalRealiseMinutes)}</Text><Text style={styles.total}>Sup. potentielles {heures(synthese.totalHeuresSupplementairesMinutes)}</Text></View></View>
      {synthese.lignes.map((ligne) => <View key={ligne.utilisateurId} style={styles.carte}><Text style={styles.nom}>{ligne.nom}</Text><Text style={styles.poste}>{ligne.poste || "Poste non renseigné"} · Contrat {ligne.contratHebdomadaire}h</Text><View style={styles.chiffres}><Text style={styles.chiffre}>Prévu\n{heures(ligne.heuresPrevuesMinutes)}</Text><Text style={styles.chiffre}>Réalisé\n{heures(ligne.heuresRealiseesMinutes)}</Text><Text style={styles.chiffre}>Écart\n{ligne.ecartMinutes >= 0 ? "+" : ""}{heures(ligne.ecartMinutes)}</Text><Text style={styles.chiffre}>Sup.\n{heures(ligne.heuresSupplementairesMinutes)}</Text></View><Text style={styles.indicateur}>{indicateur(ligne.ecartMinutes)}</Text><TextInput editable={validation?.statut !== "VALIDEE"} placeholder="Remarque du gérant" placeholderTextColor="#776F61" value={remarques[ligne.utilisateurId] ?? ligne.remarque ?? ""} onChangeText={(texte) => setRemarques((actuelles) => ({ ...actuelles, [ligne.utilisateurId]: texte }))} style={styles.input} /></View>)}
      {validation?.statut === "VALIDEE" ? <View style={styles.validation}><Text style={styles.validationTitre}>🎉 Mois validé par l’Empire</Text><Text style={styles.validationTexte}>Par {validateur?.nom ?? "Gérant"} · {validation.dateValidation ? new Date(validation.dateValidation).toLocaleString("fr-FR") : "—"}</Text></View> : <><Pressable style={styles.boutonSecondaireLarge} onPress={enregistrerRemarques}><Text style={styles.boutonSecondaireTexte}>Enregistrer les remarques</Text></Pressable><Pressable style={styles.boutonPrincipal} onPress={demanderValidation}><Text style={styles.boutonPrincipalTexte}>Valider le mois</Text></Pressable></>}
      <Pressable style={styles.boutonExport} onPress={exporter}><Text style={styles.boutonExportTexte}>Générer le PDF comptable</Text></Pressable>
    </>}
  </ScrollView></SafeAreaView>;
}

export default function ValidationHeuresScreen() { const { utilisateurActif } = useUser(); if (!utilisateurActif) return <Redirect href="/" />; if (utilisateurActif.role !== "GERANT") return <Redirect href="/" />; return <PointagePadProvider mode="GESTION_GERANT"><ValidationHeuresProvider><Contenu /></ValidationHeuresProvider></PointagePadProvider>; }

const styles = StyleSheet.create({ ecran:{flex:1,backgroundColor:"#080706"},entete:{padding:20,borderBottomWidth:1,borderColor:"#51401F"},retour:{color:"#D6A945",fontWeight:"800",marginBottom:14},surtitre:{color:"#D6A945",fontSize:12,fontWeight:"900",letterSpacing:2},titre:{color:"#F4D887",fontSize:28,fontWeight:"900",marginTop:5},navigation:{flexDirection:"row",gap:10,marginTop:15},contenu:{padding:16,paddingBottom:50,gap:12},carte:{backgroundColor:"#15120D",borderWidth:1,borderColor:"#51401F",borderRadius:14,padding:16},statut:{color:"#F4D887",fontWeight:"900"},totaux:{flexDirection:"row",flexWrap:"wrap",gap:16,marginTop:12},total:{color:"#E8E1D3",fontWeight:"700"},vide:{color:"#AFA48E",textAlign:"center"},nom:{color:"#F4D887",fontSize:18,fontWeight:"900"},poste:{color:"#AFA48E",marginTop:3},chiffres:{flexDirection:"row",justifyContent:"space-between",marginTop:15},chiffre:{color:"#E8E1D3",lineHeight:21,fontWeight:"700"},indicateur:{color:"#E8E1D3",marginTop:12},input:{color:"#FFF",backgroundColor:"#0D0B08",borderWidth:1,borderColor:"#40351F",borderRadius:9,padding:12,marginTop:12},boutonSecondaire:{borderWidth:1,borderColor:"#665129",padding:9,borderRadius:8},boutonSecondaireLarge:{borderWidth:1,borderColor:"#665129",padding:15,borderRadius:10,alignItems:"center"},boutonSecondaireTexte:{color:"#D6A945",fontWeight:"800"},boutonPrincipal:{backgroundColor:"#D6A945",padding:17,borderRadius:10,alignItems:"center"},boutonPrincipalTexte:{color:"#100D08",fontWeight:"900",fontSize:16},boutonExport:{backgroundColor:"#262014",borderWidth:1,borderColor:"#D6A945",padding:15,borderRadius:10,alignItems:"center"},boutonExportTexte:{color:"#F4D887",fontWeight:"900"},validation:{backgroundColor:"#15251B",borderWidth:1,borderColor:"#3E9B67",padding:16,borderRadius:12},validationTitre:{color:"#8ED1A7",fontSize:17,fontWeight:"900"},validationTexte:{color:"#C8D6CC",marginTop:5} });
