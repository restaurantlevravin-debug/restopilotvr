import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  Image,
  Alert,
  StyleSheet,
} from "react-native";
import { useHaccp, PointControleTemperature, ReleveTemperature } from "@/context/HaccpContext";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useRouter } from "expo-router";
import { genererRapportHaccpPdf } from "@/services/haccpReportPdf";

// ============================================================================
// TYPES
// ============================================================================

type PeriodeFiltreHistorique = "aujourd'hui" | "7jours" | "30jours" | "personnalise";
type TypeFiltreHistorique = "tous" | "conformes" | "anomalies";

interface DetailAnomalieUI {
  releve: ReleveTemperature;
  point: PointControleTemperature | undefined;
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function obtenirDateDebut(periode: PeriodeFiltreHistorique): Date {
  const aujourd = new Date();
  aujourd.setHours(0, 0, 0, 0);

  switch (periode) {
    case "aujourd'hui":
      return aujourd;
    case "7jours":
      const il_y_a_7j = new Date(aujourd);
      il_y_a_7j.setDate(aujourd.getDate() - 7);
      return il_y_a_7j;
    case "30jours":
      const il_y_a_30j = new Date(aujourd);
      il_y_a_30j.setDate(aujourd.getDate() - 30);
      return il_y_a_30j;
    case "personnalise":
      return new Date(0); // Pas de limite
    default:
      return aujourd;
  }
}

function filtrerRelevesParPeriode(
  releves: ReleveTemperature[],
  periode: PeriodeFiltreHistorique
): ReleveTemperature[] {
  const dateDebut = obtenirDateDebut(periode);

  return releves.filter((releve) => {
    const dateReleve = parseDate(releve.date);
    return dateReleve >= dateDebut;
  });
}

function filtrerRelevesParType(
  releves: ReleveTemperature[],
  type: TypeFiltreHistorique
): ReleveTemperature[] {
  switch (type) {
    case "conformes":
      return releves.filter((r) => r.conforme === true);
    case "anomalies":
      return releves.filter((r) => r.conforme === false);
    case "tous":
    default:
      return releves;
  }
}

function calculerStatistiques(releves: ReleveTemperature[]) {
  const nombreTotal = releves.length;
  const nombreConformes = releves.filter((r) => r.conforme === true).length;
  const nombreAnomalies = releves.filter((r) => r.conforme === false).length;
  const nombrePhotos = releves.filter((r) => r.photo).length;
  const tauxConformite =
    nombreTotal === 0 ? 100 : Math.round((nombreConformes / nombreTotal) * 1000) / 10;

  return {
    nombreTotal,
    nombreConformes,
    nombreAnomalies,
    nombrePhotos,
    tauxConformite,
  };
}

// ============================================================================
// COMPOSANTS
// ============================================================================

interface CardStatistiqueProps {
  label: string;
  valeur: string | number;
  couleur?: string;
  icone?: string;
}

function CardStatistique({
  label,
  valeur,
  couleur = "#00695C",
  icone = "📊",
}: CardStatistiqueProps) {
  return (
    <View style={[styles.cardStatistique, { borderLeftColor: couleur }]}>
      <Text style={styles.iconeStatistique}>{icone}</Text>
      <View>
        <Text style={styles.labelStatistique}>{label}</Text>
        <Text style={[styles.valeurStatistique, { color: couleur }]}>
          {valeur}
        </Text>
      </View>
    </View>
  );
}

interface BoutonFiltreProps {
  label: string;
  actif: boolean;
  onPress: () => void;
}

function BoutonFiltre({ label, actif, onPress }: BoutonFiltreProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.boutonFiltre,
        actif && { backgroundColor: "#00695C" },
        !actif && { backgroundColor: "#E8F5E9" },
      ]}
    >
      <Text
        style={[
          styles.textBoutonFiltre,
          actif && { color: "#FFFFFF" },
          !actif && { color: "#00695C" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface LigneReleveProps {
  releve: ReleveTemperature;
  point: PointControleTemperature | undefined;
  onPress: () => void;
}

function LigneReleve({ releve, point, onPress }: LigneReleveProps) {
  const iconeStatut = releve.conforme ? "✅" : "❌";
  const textStatut = releve.conforme ? "Conforme" : "Anomalie";
  const couleurStatut = releve.conforme ? "#4CAF50" : "#D32F2F";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ligneReleve,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.ligneRelevePart1}>
        <Text style={styles.dateReleve}>{releve.date}</Text>
        <Text style={styles.nomPoint}>{point?.nom || "Point inconnu"}</Text>
      </View>

      <View style={styles.ligneRelevePart2}>
        <Text style={styles.temperature}>{releve.temperature}°C</Text>
        <Text style={[styles.statut, { color: couleurStatut }]}>
          {iconeStatut} {textStatut}
        </Text>
      </View>

      {releve.photo && (
        <Text style={styles.iconePhoto}>📸</Text>
      )}

      {!releve.conforme && releve.actionCorrective && (
        <Text style={styles.iconeAction}>⚙️</Text>
      )}
    </Pressable>
  );
}

interface ModalDetailAnomalieProps {
  visible: boolean;
  anomalie: DetailAnomalieUI | null;
  onClose: () => void;
}

function ModalDetailAnomalie({
  visible,
  anomalie,
  onClose,
}: ModalDetailAnomalieProps) {
  if (!anomalie || !anomalie.point) return null;

  const { releve, point } = anomalie;
  const plageMin = point.temperatureMin ?? "N/A";
  const plageMax = point.temperatureMax ?? "N/A";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* En-tête */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              ❌ Détail de l'anomalie
            </Text>
            <Pressable onPress={onClose}>
              <Text style={styles.btnFermer}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Informations générales */}
            <View style={styles.sectionDetail}>
              <Text style={styles.titreSection}>📋 Informations</Text>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Date :</Text>
                <Text style={styles.valeurDetail}>{releve.date}</Text>
              </View>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Heure :</Text>
                <Text style={styles.valeurDetail}>{releve.heure}</Text>
              </View>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Entreprise :</Text>
                <Text style={styles.valeurDetail}>{/* À récupérer du contexte */}</Text>
              </View>
            </View>

            {/* Point de contrôle */}
            <View style={styles.sectionDetail}>
              <Text style={styles.titreSection}>🌡️ Point de contrôle</Text>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Nom :</Text>
                <Text style={styles.valeurDetail}>{point.nom}</Text>
              </View>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Emplacement :</Text>
                <Text style={styles.valeurDetail}>{point.zone}</Text>
              </View>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Catégorie :</Text>
                <Text style={styles.valeurDetail}>{point.typeControle}</Text>
              </View>
            </View>

            {/* Température */}
            <View style={styles.sectionDetail}>
              <Text style={styles.titreSection}>🌡️ Résultats</Text>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Température relevée :</Text>
                <Text style={[styles.valeurDetail, { color: "#D32F2F", fontWeight: "bold" }]}>
                  {releve.temperature}°C
                </Text>
              </View>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Limites attendues :</Text>
                <Text style={styles.valeurDetail}>
                  {plageMin}°C à {plageMax}°C
                </Text>
              </View>
            </View>

            {/* Photo */}
            {releve.photo && (
              <View style={styles.sectionDetail}>
                <Text style={styles.titreSection}>📸 Photo de preuve</Text>
                <Image
                  source={{ uri: releve.photo }}
                  style={styles.photoDetail}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Motif */}
            {releve.commentaireAnomalie && (
              <View style={styles.sectionDetail}>
                <Text style={styles.titreSection}>💬 Motif de l'anomalie</Text>
                <Text style={styles.texteDetail}>
                  {releve.commentaireAnomalie}
                </Text>
              </View>
            )}

            {/* Action corrective */}
            {releve.actionCorrective && (
              <View style={styles.sectionDetail}>
                <Text style={styles.titreSection}>⚙️ Action corrective</Text>
                <Text style={styles.texteDetail}>
                  {releve.actionCorrective}
                </Text>
              </View>
            )}

            {/* Responsable */}
            <View style={styles.sectionDetail}>
              <Text style={styles.titreSection}>👤 Responsable</Text>

              <View style={styles.ligneDetail}>
                <Text style={styles.labelDetail}>Responsable :</Text>
                <Text style={styles.valeurDetail}>{releve.responsable}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Bouton fermer */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.btnFermerModal,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.textBtnFermer}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// ÉCRAN PRINCIPAL
// ============================================================================

export default function HistoriqueHaccp() {
  const { releves, pointsControle } = useHaccp();
  const { entrepriseActive } = useEntreprise();
  const router = useRouter();

  async function exporterRapportPdf() {
    try {
      const uri = await genererRapportHaccpPdf({
        releves,
        pointsControle,
        entrepriseNom: entrepriseActive?.nom,
        periode: periodeFiltree === "personnalise" ? "Historique complet" : "Période sélectionnée",
        responsableEtablissement: "Responsable établissement",
      });

      Alert.alert("Rapport PDF", `Rapport généré avec succès : ${uri}`);
    } catch (error) {
      console.error(error);
      Alert.alert("Export impossible", "Le rapport HACCP n'a pas pu être généré.");
    }
  }

  // États pour les filtres
  const [periodeFiltree, setPeriodeFiltree] =
    useState<PeriodeFiltreHistorique>("aujourd'hui");
  const [typeFiltree, setTypeFiltree] = useState<TypeFiltreHistorique>("tous");

  // État pour le détail anomalie
  const [detailAnomalie, setDetailAnomalie] =
    useState<DetailAnomalieUI | null>(null);
  const [afficherModalDetail, setAfficherModalDetail] = useState(false);

  // Filtrer les relevés
  const relvesFiltres = useMemo(() => {
    let resultats = releves;
    resultats = filtrerRelevesParPeriode(resultats, periodeFiltree);
    resultats = filtrerRelevesParType(resultats, typeFiltree);
    return resultats.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB.getTime() - dateA.getTime(); // Plus récent en premier
    });
  }, [releves, periodeFiltree, typeFiltree]);

  // Calculer les statistiques
  const stats = useMemo(
    () => calculerStatistiques(relvesFiltres),
    [relvesFiltres]
  );

  // Obtenir le point de contrôle pour un relevé
  const obtenirPoint = (
    pointControleId?: string
  ): PointControleTemperature | undefined => {
    if (!pointControleId) return undefined;
    return pointsControle.find((p) => p.id === pointControleId);
  };

  // Ouvrir modal détail anomalie
  const ouvrirDetailAnomalie = (releve: ReleveTemperature) => {
    if (releve.conforme) return; // Pas d'anomalie

    const point = obtenirPoint(releve.pointControleId);
    setDetailAnomalie({ releve, point });
    setAfficherModalDetail(true);
  };

  // Affichage vide
  if (relvesFiltres.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.btnBack}>← Retour</Text>
          </Pressable>
          <Text style={styles.titre}>📊 Historique HACCP</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.labelEntreprise}>Entreprise :</Text>
            <Text style={styles.nomEntreprise}>
              {entrepriseActive?.nom || "Non sélectionnée"}
            </Text>
          </View>

          <View style={styles.containerVide}>
            <Text style={styles.textVide}>📭</Text>
            <Text style={styles.textVideMsg}>
              Aucun contrôle pour cette période
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Calcul de la barre de conformité
  const pourcentageConformite = (stats.tauxConformite / 100) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnBack}>← Retour</Text>
        </Pressable>
        <Text style={styles.titre}>📊 Historique HACCP</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Entreprise */}
        <View style={styles.sectionHeader}>
          <Text style={styles.labelEntreprise}>Entreprise :</Text>
          <Text style={styles.nomEntreprise}>
            {entrepriseActive?.nom || "Non sélectionnée"}
          </Text>
        </View>

        {/* Statistiques */}
        <View style={styles.sectionStats}>
          <CardStatistique
            label="Contrôles réalisés"
            valeur={stats.nombreTotal}
            couleur="#00695C"
            icone="📊"
          />
          <CardStatistique
            label="Conformes"
            valeur={stats.nombreConformes}
            couleur="#4CAF50"
            icone="✅"
          />
          <CardStatistique
            label="Anomalies"
            valeur={stats.nombreAnomalies}
            couleur="#D32F2F"
            icone="❌"
          />
          <CardStatistique
            label="Taux de conformité"
            valeur={`${stats.tauxConformite} %`}
            couleur="#B08D57"
            icone="📈"
          />
          <CardStatistique
            label="Photos d'anomalies"
            valeur={stats.nombrePhotos}
            couleur="#FF6F00"
            icone="📸"
          />
        </View>

        {/* Barre de conformité */}
        <View style={styles.sectionBarreConformite}>
          <Text style={styles.labelBarre}>Taux de conformité</Text>
          <View style={styles.barreConformiteContainer}>
            <View
              style={[
                styles.barreConformiteFill,
                { width: `${pourcentageConformite}%` },
              ]}
            />
          </View>
          <Text style={styles.valueBarre}>{stats.tauxConformite} %</Text>
        </View>

        {/* Filtres Période */}
        <View style={styles.sectionFiltre}>
          <Text style={styles.labelFiltre}>Période :</Text>
          <View style={styles.grupoBoutonsFiltre}>
            <BoutonFiltre
              label="Aujourd'hui"
              actif={periodeFiltree === "aujourd'hui"}
              onPress={() => setPeriodeFiltree("aujourd'hui")}
            />
            <BoutonFiltre
              label="7 jours"
              actif={periodeFiltree === "7jours"}
              onPress={() => setPeriodeFiltree("7jours")}
            />
            <BoutonFiltre
              label="30 jours"
              actif={periodeFiltree === "30jours"}
              onPress={() => setPeriodeFiltree("30jours")}
            />
            <BoutonFiltre
              label="Tous"
              actif={periodeFiltree === "personnalise"}
              onPress={() => setPeriodeFiltree("personnalise")}
            />
          </View>
        </View>

        {/* Filtres Type */}
        <View style={styles.sectionFiltre}>
          <Text style={styles.labelFiltre}>Affichage :</Text>
          <View style={styles.grupoBoutonsFiltre}>
            <BoutonFiltre
              label="Tous"
              actif={typeFiltree === "tous"}
              onPress={() => setTypeFiltree("tous")}
            />
            <BoutonFiltre
              label="✅ Conformes"
              actif={typeFiltree === "conformes"}
              onPress={() => setTypeFiltree("conformes")}
            />
            <BoutonFiltre
              label="❌ Anomalies"
              actif={typeFiltree === "anomalies"}
              onPress={() => setTypeFiltree("anomalies")}
            />
          </View>
        </View>

        <Pressable
          onPress={exporterRapportPdf}
          style={({ pressed }) => [
            styles.btnExporter,
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={styles.textBtnExporter}>Exporter rapport HACCP PDF</Text>
        </Pressable>

        {/* Liste des relevés */}
        <View style={styles.sectionListe}>
          <Text style={styles.titreSection}>📋 Relevés</Text>
          {relvesFiltres.map((releve) => (
            <LigneReleve
              key={`${releve.date}-${releve.heure}-${releve.pointControleId}`}
              releve={releve}
              point={obtenirPoint(releve.pointControleId)}
              onPress={() => ouvrirDetailAnomalie(releve)}
            />
          ))}
        </View>

        {/* Espace bas */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal détail anomalie */}
      <ModalDetailAnomalie
        visible={afficherModalDetail}
        anomalie={detailAnomalie}
        onClose={() => {
          setAfficherModalDetail(false);
          setDetailAnomalie(null);
        }}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "#00695C",
  },
  btnBack: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 12,
  },
  titre: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  labelEntreprise: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  nomEntreprise: {
    fontSize: 16,
    color: "#00695C",
    fontWeight: "700",
    marginTop: 4,
  },

  // Statistiques
  sectionStats: {
    marginBottom: 16,
  },
  cardStatistique: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: "#F5F5F5",
    borderLeftWidth: 4,
    borderRadius: 4,
  },
  iconeStatistique: {
    fontSize: 24,
    marginRight: 12,
  },
  labelStatistique: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  valeurStatistique: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },

  // Barre conformité
  sectionBarreConformite: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 4,
  },
  labelBarre: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  barreConformiteContainer: {
    height: 24,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 6,
  },
  barreConformiteFill: {
    height: "100%",
    backgroundColor: "#4CAF50",
  },
  valueBarre: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4CAF50",
    textAlign: "right",
  },

  // Filtres
  sectionFiltre: {
    marginBottom: 16,
  },
  labelFiltre: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 8,
  },
  grupoBoutonsFiltre: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  boutonFiltre: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#00695C",
  },
  textBoutonFiltre: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Liste des relevés
  btnExporter: {
    backgroundColor: "#00695C",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  textBtnExporter: {
    color: "#FFFFFF",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 14,
  },
  sectionListe: {
    marginBottom: 16,
  },
  titreSection: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00695C",
    marginBottom: 8,
  },
  ligneReleve: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    backgroundColor: "#F9F9F9",
    borderLeftWidth: 3,
    borderLeftColor: "#00695C",
    borderRadius: 4,
  },
  ligneRelevePart1: {
    flex: 1,
  },
  ligneRelevePart2: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  dateReleve: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginBottom: 2,
  },
  nomPoint: {
    fontSize: 13,
    color: "#333",
    fontWeight: "600",
  },
  temperature: {
    fontSize: 13,
    fontWeight: "700",
    color: "#00695C",
    marginBottom: 2,
  },
  statut: {
    fontSize: 11,
    fontWeight: "600",
  },
  iconePhoto: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  iconeAction: {
    fontSize: 16,
  },

  // Container vide
  containerVide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  textVide: {
    fontSize: 48,
    marginBottom: 16,
  },
  textVideMsg: {
    fontSize: 16,
    color: "#999",
    fontWeight: "500",
  },

  // Modal détail
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D32F2F",
  },
  btnFermer: {
    fontSize: 24,
    color: "#999",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionDetail: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ligneDetail: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  labelDetail: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  valeurDetail: {
    fontSize: 12,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  texteDetail: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
    marginBottom: 4,
  },
  photoDetail: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
  btnFermerModal: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#00695C",
    borderRadius: 8,
    alignItems: "center",
  },
  textBtnFermer: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
