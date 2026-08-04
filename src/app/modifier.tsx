import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
} from "react-native";

import { usePersonnel } from "@/context/PersonnelContext";


export default function Modifier() {

  const router = useRouter();

  const { id } = useLocalSearchParams<{ id:string }>();

  const {
    personnel,
    modifierSalarie,
  } = usePersonnel();


  const salarieTrouve = personnel.find(
    (p) => p.id === Number(id)
  );


  if (!salarieTrouve) {

    return (

      <Text>
        Salarié introuvable
      </Text>

    );

  }


  const salarie = salarieTrouve;


  const [nom, setNom] = useState(salarie.nom);
  const [prenom, setPrenom] = useState(salarie.prenom);
  const [dateNaissance, setDateNaissance] = useState(salarie.dateNaissance);
  const [sexe, setSexe] = useState(salarie.sexe);
  const [nationalite, setNationalite] = useState(salarie.nationalite || "");
  const [numeroSecuriteSociale, setNumeroSecuriteSociale] = useState(
    salarie.numeroSecuriteSociale || ""
  );
  const [adresse, setAdresse] = useState(salarie.adresse);
  const [fonction, setFonction] = useState(salarie.fonction);
  const [contrat, setContrat] = useState(salarie.contrat);
  const [dateEntree, setDateEntree] = useState(salarie.dateEntree);
  const [dateSortie, setDateSortie] = useState(salarie.dateSortie);
  const [actif, setActif] = useState(salarie.actif);



  function enregistrer() {


    modifierSalarie(

      salarie.id,

      {
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
        dateSortie,
        actif,
      }

    );


    router.replace(
  `/fiche?id=${salarie.id}`
);

  }



  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        ✏️ Modifier salarié
      </Text>



      <TextInput
        style={styles.input}
        value={nom}
        onChangeText={setNom}
        placeholder="Nom"
      />


      <TextInput
        style={styles.input}
        value={prenom}
        onChangeText={setPrenom}
        placeholder="Prénom"
      />


      <TextInput
        style={styles.input}
        value={dateNaissance}
        onChangeText={setDateNaissance}
        placeholder="Date de naissance"
      />


      <TextInput
        style={styles.input}
        value={sexe}
        onChangeText={setSexe}
        placeholder="Sexe"
      />


      <TextInput
        style={styles.input}
        value={nationalite}
        onChangeText={setNationalite}
        placeholder="Nationalité"
      />


      <TextInput
        style={styles.input}
        value={numeroSecuriteSociale}
        onChangeText={setNumeroSecuriteSociale}
        placeholder="Numéro de sécurité sociale"
      />


      <TextInput
        style={styles.input}
        value={adresse}
        onChangeText={setAdresse}
        placeholder="Adresse"
      />


      <TextInput
        style={styles.input}
        value={fonction}
        onChangeText={setFonction}
        placeholder="Fonction"
      />


      <TextInput
        style={styles.input}
        value={contrat}
        onChangeText={setContrat}
        placeholder="Contrat"
      />


      <TextInput
        style={styles.input}
        value={dateEntree}
        onChangeText={setDateEntree}
        placeholder="Date d'entrée"
      />


      <TextInput
        style={styles.input}
        value={dateSortie}
        onChangeText={setDateSortie}
        placeholder="Date de sortie"
      />


      <Pressable
        style={styles.statusButton}
        onPress={() => setActif(!actif)}
      >
        <Text style={styles.buttonText}>
          {actif ? "🟢 Salarié actif" : "🔴 Salarié sorti"}
        </Text>
      </Pressable>



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
  },

  statusButton:{
    backgroundColor:"#B08D57",
    padding:18,
    borderRadius:12,
    marginBottom:15,
  },


  buttonText:{
    color:"#FFFFFF",
    textAlign:"center",
    fontSize:17,
    fontWeight:"bold",
  },

});
