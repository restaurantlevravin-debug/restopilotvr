import * as DocumentPicker from "expo-document-picker";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useEntreprise } from "@/context/EntrepriseContext";
import { useDocuments } from "@/context/DocumentContext";
import { useUser } from "@/context/UserContext";
import { CATEGORIES_DOCUMENT_SALARIE, type CategorieDocumentSalarie, type DocumentSalarie } from "@/types/documentSalarie";

const LIBELLES: Record<CategorieDocumentSalarie, string> = {
  CONTRAT: "Contrat", AVENANT: "Avenant", IDENTITE: "Identité", DIPLOME: "Diplôme",
  FORMATION: "Formation", HACCP: "HACCP", ARRET_TRAVAIL: "Arrêt travail", AUTRE: "Autre",
};

export default function DocumentsPersonnelScreen() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, utilisateurs, modifierUtilisateur } = useUser();
  const { ajouterDocument, modifierDocument, supprimerDocument, obtenirDocumentsSalaries } = useDocuments();
  const salaries = utilisateurs.filter((utilisateur) => utilisateur.entrepriseId === entrepriseActive?.id && utilisateur.role !== "GERANT");
  const [utilisateurId, setUtilisateurId] = useState("");
  const [categorie, setCategorie] = useState<CategorieDocumentSalarie>("CONTRAT");
  const [nom, setNom] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [dateExpiration, setDateExpiration] = useState("");
  const [fichier, setFichier] = useState<{ nom: string; uri: string }>();
  const [editionId, setEditionId] = useState<string>();
  const salarie = salaries.find((utilisateur) => utilisateur.id === utilisateurId);
  const documents = obtenirDocumentsSalaries(utilisateurId);

  useEffect(() => { if (!utilisateurId && salaries[0]) setUtilisateurId(salaries[0].id); }, [utilisateurId, salaries]);

  if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) return <Redirect href="/" />;

  async function choisirPdf() {
    const resultat = await DocumentPicker.getDocumentAsync({ type: "application/pdf", copyToCacheDirectory: true, multiple: false });
    if (!resultat.canceled) {
      const asset = resultat.assets[0];
      setFichier({ nom: asset.name, uri: asset.uri });
      if (!nom) setNom(asset.name.replace(/\.pdf$/i, ""));
    }
  }

  async function enregistrer() {
    if (!utilisateurActif || !entrepriseActive || !salarie || !nom.trim()) { Alert.alert("Informations manquantes", "Choisissez un salarié et renseignez le nom du document."); return; }
    const dateValide = (date: string) => !date || /^\d{4}-\d{2}-\d{2}$/.test(date);
    if (!dateValide(dateExpiration)) { Alert.alert("Date incorrecte", "Utilisez le format AAAA-MM-JJ."); return; }
    if (editionId) {
      await modifierDocument(editionId, { nom: nom.trim(), categorie, commentaire: commentaire.trim() || undefined, dateExpiration: dateExpiration || undefined });
    } else {
      if (!fichier) { Alert.alert("PDF requis", "Sélectionnez le fichier PDF à référencer."); return; }
      await ajouterDocument({
        entrepriseId: entrepriseActive.id, utilisateurId: salarie.id, nom: nom.trim(), categorie,
        fichier: fichier.nom, fileUri: fichier.uri, commentaire: commentaire.trim() || undefined,
        dateExpiration: dateExpiration || undefined,
      });
    }
    reinitialiser();
  }

  function reinitialiser() { setNom(""); setCommentaire(""); setDateExpiration(""); setFichier(undefined); setEditionId(undefined); setCategorie("CONTRAT"); }
  function editer(document: DocumentSalarie) { setEditionId(document.id); setNom(document.nom); setCategorie(document.categorie); setCommentaire(document.commentaire ?? ""); setDateExpiration(document.dateExpiration ?? ""); setFichier(undefined); }
  function confirmerSuppression(document: DocumentSalarie) {
    if (!utilisateurActif) return;
    Alert.alert("Supprimer le document ?", document.nom, [{ text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: async () => { await supprimerDocument(document.id); } }]);
  }

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
    <Text style={styles.surtitre}>GESTION DU PERSONNEL</Text><Text style={styles.titre}>Dossier administratif</Text>
    <Text style={styles.label}>Salarié</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{salaries.map((utilisateur) => <Pressable key={utilisateur.id} onPress={() => { setUtilisateurId(utilisateur.id); reinitialiser(); }} style={[styles.puce, utilisateur.id === utilisateurId && styles.puceActive]}><Text style={styles.puceTexte}>{utilisateur.nom}</Text></Pressable>)}</ScrollView>
    {!salarie ? <Text style={styles.vide}>Aucun salarié multi-entreprise disponible.</Text> : <>
      <View style={styles.carte}><Text style={styles.carteTitre}>Informations RH</Text><Text style={styles.texte}>{salarie.nom}</Text><Text style={styles.secondaire}>Poste : {salarie.poste || "Non renseigné"}</Text><Text style={styles.secondaire}>Contrat : {salarie.contrat || "Non renseigné"}</Text><Text style={styles.secondaire}>Heures contractuelles : {salarie.heuresContractuelles !== undefined ? `${salarie.heuresContractuelles} h` : "Non renseignées"}</Text><Text style={styles.secondaire}>Documents disponibles : {documents.length}</Text>
        <Pressable style={styles.permission} onPress={() => void modifierUtilisateur(salarie.id, { consultationDocumentsAutorisee: !salarie.consultationDocumentsAutorisee })}><Text style={styles.permissionTexte}>{salarie.consultationDocumentsAutorisee ? "✓ Consultation salarié autorisée" : "Consultation salarié désactivée"}</Text></Pressable>
      </View>
      <View style={styles.carte}><Text style={styles.carteTitre}>{editionId ? "Modifier les informations" : "Ajouter un document"}</Text><Text style={styles.label}>Catégorie</Text><View style={styles.puces}>{CATEGORIES_DOCUMENT_SALARIE.map((valeur) => <Pressable key={valeur} onPress={() => setCategorie(valeur)} style={[styles.puce, categorie === valeur && styles.puceActive]}><Text style={styles.puceTexte}>{LIBELLES[valeur]}</Text></Pressable>)}</View><TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Nom du document" placeholderTextColor="#807765" />{!editionId && <Pressable style={styles.boutonSecondaire} onPress={() => void choisirPdf()}><Text style={styles.boutonSecondaireTexte}>{fichier ? `📄 ${fichier.nom}` : "Choisir un fichier PDF"}</Text></Pressable>}<TextInput style={styles.input} value={dateExpiration} onChangeText={setDateExpiration} placeholder="Expiration AAAA-MM-JJ (facultative)" placeholderTextColor="#807765" /><TextInput style={[styles.input, styles.commentaire]} value={commentaire} onChangeText={setCommentaire} placeholder="Commentaire (facultatif)" placeholderTextColor="#807765" multiline /><View style={styles.actions}>{editionId && <Pressable style={styles.boutonSecondaire} onPress={reinitialiser}><Text style={styles.boutonSecondaireTexte}>Annuler</Text></Pressable>}<Pressable style={styles.boutonPrincipal} onPress={() => void enregistrer()}><Text style={styles.boutonPrincipalTexte}>{editionId ? "Enregistrer" : "Ajouter"}</Text></Pressable></View></View>
      <Text style={styles.section}>Documents</Text>{documents.length === 0 ? <Text style={styles.vide}>Aucun document enregistré.</Text> : documents.map((document) => <View key={document.id} style={styles.document}><View style={styles.documentInfo}><Text style={styles.documentNom}>📄 {document.nom}</Text><Text style={styles.secondaire}>{LIBELLES[document.categorie]} · {new Date(document.dateAjout).toLocaleDateString("fr-FR")}</Text>{document.dateExpiration && <Text style={styles.secondaire}>Expiration : {document.dateExpiration} · {document.statut.replaceAll("_", " ")}</Text>}<Text style={styles.fichier}>{document.fichier}</Text></View><View style={styles.actions}><Pressable onPress={() => void Linking.openURL(document.fileUri)}><Text style={styles.action}>Ouvrir</Text></Pressable><Pressable onPress={() => editer(document)}><Text style={styles.action}>Modifier</Text></Pressable><Pressable onPress={() => confirmerSuppression(document)}><Text style={styles.supprimer}>Supprimer</Text></Pressable></View></View>)}
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: "#090909" }, contenu: { padding: 18, gap: 13, paddingBottom: 50 }, surtitre: { color: "#96712a", fontSize: 10, letterSpacing: 3, textAlign: "center" }, titre: { color: "#efd27a", fontSize: 28, fontWeight: "900", textAlign: "center" }, label: { color: "#d8c89f", fontWeight: "800" }, puces: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, puce: { borderWidth: 1, borderColor: "#5c513b", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, marginRight: 7 }, puceActive: { backgroundColor: "#78591c", borderColor: "#d0a447" }, puceTexte: { color: "#ecdaaa", fontSize: 12, fontWeight: "700" }, carte: { backgroundColor: "#17140f", borderWidth: 1, borderColor: "#59451f", borderRadius: 15, padding: 15, gap: 10 }, carteTitre: { color: "#efd27a", fontSize: 18, fontWeight: "900" }, texte: { color: "#f4ead0", fontSize: 17, fontWeight: "800" }, secondaire: { color: "#aaa08a" }, permission: { borderWidth: 1, borderColor: "#76602d", borderRadius: 10, minHeight: 45, justifyContent: "center", paddingHorizontal: 12 }, permissionTexte: { color: "#d9bf74", fontWeight: "700" }, input: { minHeight: 50, backgroundColor: "#242018", borderWidth: 1, borderColor: "#554a35", borderRadius: 10, color: "#fff1ca", paddingHorizontal: 12 }, commentaire: { minHeight: 76, textAlignVertical: "top", paddingTop: 12 }, boutonPrincipal: { minHeight: 48, backgroundColor: "#a97b27", borderRadius: 10, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }, boutonPrincipalTexte: { color: "#0b0905", fontWeight: "900" }, boutonSecondaire: { minHeight: 48, borderWidth: 1, borderColor: "#76602d", borderRadius: 10, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", flexShrink: 1 }, boutonSecondaireTexte: { color: "#e0c77f", fontWeight: "800" }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }, section: { color: "#efd27a", fontSize: 20, fontWeight: "900", marginTop: 7 }, vide: { color: "#9e9581", padding: 15, textAlign: "center" }, document: { backgroundColor: "#15130f", borderLeftWidth: 4, borderLeftColor: "#a87a27", borderRadius: 11, padding: 14, gap: 12 }, documentInfo: { gap: 4 }, documentNom: { color: "#f1e5c7", fontSize: 16, fontWeight: "800" }, fichier: { color: "#817968", fontSize: 11 }, action: { color: "#d8b85f", fontWeight: "800" }, supprimer: { color: "#df8275", fontWeight: "800" } });
