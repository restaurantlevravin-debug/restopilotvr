import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useHaccp } from "@/context/HaccpContext";


export default function HistoriqueHaccp(){

  const {
    releves,
    traces,
    actions,
  } = useHaccp();


  return (

    <ScrollView style={styles.container}>


      <Text style={styles.title}>
        📋 Historique HACCP complet
      </Text>


      {/* TEMPERATURES */}

      <Text style={styles.sectionTitle}>
        🌡 Relevés températures
      </Text>


      {
        releves.length === 0 ? (

          <Text style={styles.empty}>
            Aucun relevé enregistré
          </Text>

        ) : (

          releves.slice().reverse().map((releve)=>(

            <View
              key={releve.id}
              style={styles.card}
            >

              <Text>
                📅 {releve.date} - {releve.periode}
              </Text>

              <Text>
                🌡 {releve.temperature}°C
              </Text>

              <Text>
                👤 {releve.responsable}
              </Text>

              <Text>
                {releve.conforme ? "✅ Conforme" : "⚠️ Non conforme"}
              </Text>

            </View>

          ))

        )
      }



      {/* TRACABILITE */}

      <Text style={styles.sectionTitle}>
        📦 Traçabilité fournisseurs
      </Text>


      {
        traces.length === 0 ? (

          <Text style={styles.empty}>
            Aucune réception enregistrée
          </Text>

        ) : (

          traces.slice().reverse().map((trace)=>(

            <View
              key={trace.id}
              style={styles.card}
            >

              <Text style={styles.bold}>
                📦 {trace.produit}
              </Text>

              <Text>
                🏭 {trace.fournisseur}
              </Text>

              <Text>
                📅 Réception : {trace.dateReception}
              </Text>

              <Text>
                ⏳ DLC : {trace.dlc}
              </Text>

              <Text>
                🔢 Lot : {trace.lot || "Non renseigné"}
              </Text>

              {
                trace.photo && (

                  <Text>
                    📷 Étiquette jointe
                  </Text>

                )
              }

            </View>

          ))

        )
      }



      {/* ACTIONS */}

      <Text style={styles.sectionTitle}>
        ⚠️ Actions correctives
      </Text>


      {
        actions.length === 0 ? (

          <Text style={styles.empty}>
            Aucune action corrective
          </Text>

        ) : (

          actions.slice().reverse().map((action)=>(

            <View
              key={action.id}
              style={styles.card}
            >

              <Text>
                ⚠️ {action.probleme}
              </Text>

              <Text>
                🔧 Action : {action.action}
              </Text>

              <Text>
                👤 Responsable : {action.responsable}
              </Text>

              <Text>
                ✅ Résolution : {action.resolution}
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
    padding:16,
  },


  title:{
    fontSize:22,
    fontWeight:"bold",
    marginBottom:20,
  },


  sectionTitle:{
    fontSize:18,
    fontWeight:"bold",
    marginTop:20,
    marginBottom:10,
  },


  card:{
    padding:15,
    borderRadius:10,
    marginBottom:10,
  },


  bold:{
    fontWeight:"bold",
  },


  empty:{
    color:"#777",
  },

});