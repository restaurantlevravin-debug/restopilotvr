import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { usePersonnel } from "@/context/PersonnelContext";


export default function Personnel() {

  const router = useRouter();

  const { personnel } = usePersonnel();


  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        👥 Personnel
      </Text>



      <Pressable
  style={styles.addButton}
  onPress={() => router.push("/nouveau")}
>
  <Text style={styles.buttonText}>
    ➕ Nouveau salarié
  </Text>
</Pressable>

<Pressable
  style={styles.registerButton}
  onPress={() => router.push("/registre")}
>
  <Text style={styles.buttonText}>
    📋 Registre unique du personnel
  </Text>
</Pressable>



      <Text style={styles.section}>
        Salariés enregistrés
      </Text>



      {
        personnel.length === 0 ? (

          <View style={styles.card}>

            <Text style={styles.empty}>
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
                {salarie.prenom} {salarie.nom}
              </Text>



              <Text style={styles.fonction}>
                {salarie.fonction}
              </Text>



              <Text style={styles.contrat}>
                {salarie.contrat}
              </Text>



              <Pressable
                style={styles.ficheButton}
                onPress={() =>
                  router.push(
                    `/fiche?id=${salarie.id}`
                  )
                }
              >

                <Text style={styles.buttonText}>
                  👤 Voir fiche salarié
                </Text>


              </Pressable>


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
    fontSize:32,
    fontWeight:"bold",
    color:"#00695C",
    textAlign:"center",
    marginVertical:25,
  },


  addButton:{
    backgroundColor:"#00695C",
    padding:18,
    borderRadius:12,
    marginBottom:30,
  },


  section:{
    fontSize:22,
    fontWeight:"bold",
    color:"#00695C",
    marginBottom:15,
  },


  card:{
    backgroundColor:"#FFFFFF",
    padding:18,
    borderRadius:15,
    borderLeftWidth:6,
    borderLeftColor:"#B08D57",
    marginBottom:15,
  },


  nom:{
    fontSize:20,
    fontWeight:"bold",
  },


  fonction:{
    marginTop:8,
    color:"#555",
  },


  contrat:{
    marginTop:8,
    color:"#00695C",
  },


  ficheButton:{
    backgroundColor:"#B08D57",
    padding:15,
    borderRadius:10,
    marginTop:15,
  },


  empty:{
    color:"#777",
  },


  buttonText:{
    color:"#FFFFFF",
    textAlign:"center",
    fontSize:17,
    fontWeight:"bold",
  },
registerButton:{
  backgroundColor:"#B08D57",
  padding:18,
  borderRadius:12,
  marginBottom:30,
},
});