import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  DocumentsSalarie,
  usePersonnel,
} from "@/context/PersonnelContext";


type DocumentKey = keyof DocumentsSalarie;


const DOCUMENTS:{
  cle:DocumentKey;
  libelle:string;
}[] = [
  { cle:"contratTravail", libelle:"Contrat de travail" },
  { cle:"pieceIdentite", libelle:"Pièce d'identité" },
  { cle:"visiteMedicale", libelle:"Visite médicale" },
  { cle:"mutuelle", libelle:"Mutuelle" },
  { cle:"rib", libelle:"RIB" },
  { cle:"permisTravail", libelle:"Permis de travail (optionnel)" },
];


export default function Documents() {

  const router = useRouter();
  const { id } = useLocalSearchParams<{ id:string }>();
  const {
    personnel,
    modifierDocuments,
  } = usePersonnel();

  const salarie = personnel.find(
    (p) => p.id === Number(id)
  );


  if (!salarie) {

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Salarié introuvable</Text>
      </View>
    );

  }


  const salarieSelectionne = salarie;


  function basculerDocument(cle:DocumentKey){

    modifierDocuments(
      salarieSelectionne.id,
      {
        ...salarieSelectionne.documents,
        [cle]:!salarieSelectionne.documents[cle],
      }
    );

  }


  return (

    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        📂 Documents salarié
      </Text>

      <Text style={styles.name}>
        {salarie.prenom} {salarie.nom}
      </Text>

      {DOCUMENTS.map(({ cle, libelle }) => {

        const present = salarie.documents[cle];

        return (
          <View key={cle} style={styles.card}>
            <Text style={styles.documentName}>{libelle}</Text>

            <Pressable
              style={[
                styles.statusButton,
                present ? styles.presentButton : styles.missingButton,
              ]}
              onPress={() => basculerDocument(cle)}
            >
              <Text style={styles.buttonText}>
                {present ? "✅ Présent" : "❌ Manquant"}
              </Text>
            </Pressable>
          </View>
        );

      })}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>⬅ Retour à la fiche</Text>
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
    marginTop:25,
  },

  name:{
    fontSize:20,
    fontWeight:"bold",
    textAlign:"center",
    marginTop:10,
    marginBottom:25,
  },

  card:{
    backgroundColor:"#FFFFFF",
    padding:18,
    borderRadius:15,
    borderLeftWidth:6,
    borderLeftColor:"#B08D57",
    marginBottom:15,
  },

  documentName:{
    fontSize:18,
    fontWeight:"bold",
    marginBottom:14,
  },

  statusButton:{
    padding:14,
    borderRadius:10,
  },

  presentButton:{
    backgroundColor:"#00695C",
  },

  missingButton:{
    backgroundColor:"#B08D57",
  },

  backButton:{
    backgroundColor:"#666666",
    padding:18,
    borderRadius:12,
    marginTop:10,
    marginBottom:40,
  },

  buttonText:{
    color:"#FFFFFF",
    textAlign:"center",
    fontSize:17,
    fontWeight:"bold",
  },

});
