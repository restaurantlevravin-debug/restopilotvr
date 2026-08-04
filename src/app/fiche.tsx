import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { usePersonnel } from "@/context/PersonnelContext";


export default function Fiche() {

  const router = useRouter();

  const { id } = useLocalSearchParams<{ id:string }>();

  const {
    personnel,
    supprimerSalarie,
  } = usePersonnel();


  const salarie = personnel.find(
    (p) => p.id === Number(id)
  );


  if (!salarie) {

    return (

      <View style={styles.container}>

        <Text style={styles.title}>
          Salarié introuvable
        </Text>

      </View>

    );

  }



  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        👤 Fiche salarié
      </Text>


      <View style={styles.card}>

        <Text style={styles.sectionTitle}>
          👤 Informations personnelles
        </Text>

        <Text style={styles.nom}>
          {salarie.prenom} {salarie.nom}
        </Text>

        <Text style={styles.ligne}>
          Date de naissance : {salarie.dateNaissance}
        </Text>

        <Text style={styles.ligne}>
          Sexe : {salarie.sexe}
        </Text>

        <Text style={styles.ligne}>
          Nationalité : {salarie.nationalite || "Non renseignée"}
        </Text>

        <Text style={styles.ligne}>
          Numéro de sécurité sociale : {salarie.numeroSecuriteSociale || "Non renseigné"}
        </Text>

        <Text style={styles.ligne}>
          Adresse : {salarie.adresse}
        </Text>

        <Text style={styles.sectionTitle}>
          💼 Informations professionnelles
        </Text>

        <Text style={styles.ligne}>
          Fonction : {salarie.fonction}
        </Text>


        <Text style={styles.ligne}>
          Contrat : {salarie.contrat}
        </Text>


        <Text style={styles.ligne}>
          Entrée : {salarie.dateEntree}
        </Text>

        <Text style={styles.ligne}>
          Sortie : {salarie.dateSortie || "Non renseignée"}
        </Text>


        <Text style={styles.statut}>
          {salarie.actif ? "🟢 Actif" : "🔴 Sorti"}
        </Text>


      </View>


      <View style={styles.documentsCard}>

        <Text style={styles.documentsTitle}>
          📂 Documents salarié
        </Text>

        <Text style={styles.ligne}>
          Contrat de travail : {salarie.documents.contratTravail ? "🟢 Présent" : "🔴 Manquant"}
        </Text>

        <Text style={styles.ligne}>
          Pièce d'identité : {salarie.documents.pieceIdentite ? "🟢 Présente" : "🔴 Manquante"}
        </Text>

        <Text style={styles.ligne}>
          Visite médicale : {salarie.documents.visiteMedicale ? "🟢 Présente" : "🔴 Manquante"}
        </Text>

        <Text style={styles.ligne}>
          Mutuelle : {salarie.documents.mutuelle ? "🟢 Présente" : "🔴 Manquante"}
        </Text>

        <Text style={styles.ligne}>
          RIB : {salarie.documents.rib ? "🟢 Présent" : "🔴 Manquant"}
        </Text>

        <Text style={styles.ligne}>
          Permis de travail : {salarie.documents.permisTravail ? "🟢 Présent" : "🔴 Manquant"}
        </Text>

      </View>


      <Pressable
        style={styles.documentsButton}
        onPress={() =>
          router.push(
            `/documents?id=${salarie.id}`
          )
        }
      >

        <Text style={styles.buttonText}>
          📂 Gérer les documents
        </Text>

      </Pressable>



      <Pressable
        style={styles.modifyButton}
        onPress={() =>
          router.push(
            `/modifier?id=${salarie.id}`
          )
        }
      >

        <Text style={styles.buttonText}>
          ✏️ Modifier
        </Text>

      </Pressable>



      <Pressable
        style={styles.deleteButton}
        onPress={() => {

          supprimerSalarie(salarie.id);

          router.replace("/personnel");

        }}
      >

        <Text style={styles.buttonText}>
          🗑️ Supprimer
        </Text>

      </Pressable>



      <Pressable
        style={styles.backButton}
        onPress={() => router.push("/personnel")}
      >

        <Text style={styles.buttonText}>
          ⬅ Retour
        </Text>

      </Pressable>


    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container:{
    flex:1,
    backgroundColor:"#F3F3F3",
    padding:20,
  },

  title:{
    fontSize:30,
    fontWeight:"bold",
    color:"#00695C",
    textAlign:"center",
    marginVertical:25,
  },

  card:{
    backgroundColor:"#FFFFFF",
    padding:20,
    borderRadius:15,
  },

  nom:{
    fontSize:24,
    fontWeight:"bold",
    marginBottom:20,
  },

  sectionTitle:{
    fontSize:21,
    fontWeight:"bold",
    color:"#00695C",
    marginBottom:16,
  },

  ligne:{
    fontSize:17,
    marginBottom:12,
  },

  statut:{
    fontSize:18,
    fontWeight:"bold",
    marginTop:4,
  },

  documentsCard:{
    backgroundColor:"#FFFFFF",
    padding:20,
    borderRadius:15,
    marginTop:20,
    borderLeftWidth:6,
    borderLeftColor:"#B08D57",
  },

  documentsTitle:{
    fontSize:21,
    fontWeight:"bold",
    color:"#00695C",
    marginBottom:16,
  },

  documentsButton:{
    backgroundColor:"#B08D57",
    padding:18,
    borderRadius:12,
    marginTop:15,
  },

  modifyButton:{
    backgroundColor:"#00695C",
    padding:18,
    borderRadius:12,
    marginTop:25,
  },

  deleteButton:{
    backgroundColor:"#C62828",
    padding:18,
    borderRadius:12,
    marginTop:15,
  },

  backButton:{
    backgroundColor:"#666666",
    padding:18,
    borderRadius:12,
    marginTop:15,
  },

  buttonText:{
    color:"#FFFFFF",
    textAlign:"center",
    fontSize:18,
    fontWeight:"bold",
  },

});
