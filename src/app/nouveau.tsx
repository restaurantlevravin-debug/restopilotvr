import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { usePersonnel } from "@/context/PersonnelContext";


export default function Nouveau() {

  const router = useRouter();

  const { ajouterSalarie } = usePersonnel();


  const [nom,setNom] = useState("");
  const [prenom,setPrenom] = useState("");
  const [dateNaissance,setDateNaissance] = useState("");
  const [sexe,setSexe] = useState("");
  const [nationalite,setNationalite] = useState("");
  const [numeroSecuriteSociale,setNumeroSecuriteSociale] = useState("");
  const [adresse,setAdresse] = useState("");
  const [fonction,setFonction] = useState("");
  const [contrat,setContrat] = useState("");
  const [dateEntree,setDateEntree] = useState("");



  function enregistrer(){


    ajouterSalarie({

      nom,
      prenom,
      dateNaissance,
      sexe,
      nationalite,
      numeroSecuriteSociale,
      adresse,
      fonction,
      contrat,
      dateEntree,
      dateSortie:"",
      actif:true,
      documents:{
        contratTravail:false,
        pieceIdentite:false,
        visiteMedicale:false,
        mutuelle:false,
        rib:false,
        permisTravail:false,
      },

    });


    router.push("/personnel");

  }



  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        ➕ Nouveau salarié
      </Text>



      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={nom}
        onChangeText={setNom}
      />


      <TextInput
        style={styles.input}
        placeholder="Prénom"
        value={prenom}
        onChangeText={setPrenom}
      />


      <TextInput
        style={styles.input}
        placeholder="Date de naissance"
        value={dateNaissance}
        onChangeText={setDateNaissance}
      />


      <TextInput
        style={styles.input}
        placeholder="Sexe"
        value={sexe}
        onChangeText={setSexe}
      />


      <TextInput
        style={styles.input}
        placeholder="Nationalité"
        value={nationalite}
        onChangeText={setNationalite}
      />


      <TextInput
        style={styles.input}
        placeholder="Numéro de sécurité sociale"
        value={numeroSecuriteSociale}
        onChangeText={setNumeroSecuriteSociale}
      />


      <TextInput
        style={styles.input}
        placeholder="Adresse"
        value={adresse}
        onChangeText={setAdresse}
      />


      <TextInput
        style={styles.input}
        placeholder="Fonction"
        value={fonction}
        onChangeText={setFonction}
      />


      <TextInput
        style={styles.input}
        placeholder="Contrat"
        value={contrat}
        onChangeText={setContrat}
      />


      <TextInput
        style={styles.input}
        placeholder="Date d'entrée"
        value={dateEntree}
        onChangeText={setDateEntree}
      />



      <Pressable
        style={styles.button}
        onPress={enregistrer}
      >

        <Text style={styles.buttonText}>
          💾 Enregistrer
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


  input:{
    backgroundColor:"#FFFFFF",
    padding:15,
    borderRadius:10,
    marginBottom:15,
  },


  button:{
    backgroundColor:"#00695C",
    padding:18,
    borderRadius:12,
    marginBottom:40,
  },


  buttonText:{
    color:"#FFFFFF",
    textAlign:"center",
    fontSize:18,
    fontWeight:"bold",
  },

});
