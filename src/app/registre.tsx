import { ScrollView, StyleSheet, Text, View } from "react-native";

import { usePersonnel } from "@/context/PersonnelContext";


export default function Registre() {

  const { personnel } = usePersonnel();


  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        📋 Registre unique du personnel
      </Text>


      {
        personnel.length === 0 ? (

          <View style={styles.card}>

            <Text>
              Aucun salarié enregistré
            </Text>

          </View>


        ) : (

          personnel.map((salarie) => (

            <View
              key={salarie.id}
              style={styles.card}
            >

              <Text style={styles.nom}>
                {salarie.nom} {salarie.prenom}
              </Text>


              <Text style={styles.ligne}>
                Date de naissance : {salarie.dateNaissance}
              </Text>


              <Text style={styles.ligne}>
                Sexe : {salarie.sexe}
              </Text>


              <Text style={styles.ligne}>
                N° sécurité sociale : {salarie.numeroSecuriteSociale}
              </Text>


              <Text style={styles.ligne}>
                Adresse : {salarie.adresse}
              </Text>


              <Text style={styles.ligne}>
                Contrat : {salarie.contrat}
              </Text>


              <Text style={styles.ligne}>
                Date d'entrée : {salarie.dateEntree}
              </Text>


              <Text style={styles.ligne}>
                Date de sortie : {salarie.dateSortie || "En poste"}
              </Text>


            </View>

          ))

        )

      }


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
    fontSize:28,
    fontWeight:"bold",
    color:"#00695C",
    textAlign:"center",
    marginVertical:25,
  },


  card:{
    backgroundColor:"#FFFFFF",
    padding:20,
    borderRadius:15,
    marginBottom:15,
    borderLeftWidth:6,
    borderLeftColor:"#B08D57",
  },


  nom:{
    fontSize:22,
    fontWeight:"bold",
    marginBottom:15,
  },


  ligne:{
    fontSize:16,
    marginBottom:8,
  },

});