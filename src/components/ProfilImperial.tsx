import { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { rewards } from "@/constants/rewards";
import { useRewards } from "@/context/RewardContext";
import { useUser } from "@/context/UserContext";

const OR = "#D7A83E";
const OR_CLAIR = "#F7D77B";
const FOND = "#080706";
const CARTE = "#15110C";

export default function ProfilImperial() {
  const { utilisateurActif } = useUser();
  const {
    profilImperial,
    chargement,
    recompenseRecente,
    changerAvatarUtilisateur,
    fermerNotificationRecompense,
  } = useRewards();
  const apparition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(apparition, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [apparition]);

  const avatar = rewards.find(
    (recompense) => recompense.id === profilImperial?.avatarActuel
  ) ?? rewards[0];
  const recompensesObtenues = rewards.filter((recompense) =>
    profilImperial?.recompensesDebloquees.includes(recompense.id)
  );
  const prochaineRecompense = useMemo(() => {
    const ids = profilImperial?.recompensesDebloquees ?? [];
    const prochainId = !ids.includes("padawan")
      ? "padawan"
      : !ids.includes("monstre")
        ? "monstre"
        : !ids.includes("empereur")
          ? "empereur"
          : undefined;
    return rewards.find((recompense) => recompense.id === prochainId);
  }, [profilImperial?.recompensesDebloquees]);
  const tauxConformite = profilImperial?.nombreActionsEvaluees
    ? profilImperial.nombreActionsConformes / profilImperial.nombreActionsEvaluees
    : 0;
  const progression = prochaineRecompense?.id === "padawan"
    ? 0
    : prochaineRecompense?.id === "monstre"
      ? Math.min(1, (profilImperial?.nombreActionsConformes ?? 0) / 100)
      : prochaineRecompense?.id === "empereur"
        ? Math.min(1, (profilImperial?.nombreActionsConformes ?? 0) / 500)
        : 1;
  const objectifProgression = prochaineRecompense?.id === "padawan"
    ? "Faites valider un premier relevé conforme"
    : prochaineRecompense?.id === "monstre"
      ? `${Math.max(0, 100 - (profilImperial?.nombreActionsConformes ?? 0))} actions conformes restantes • ${(tauxConformite * 100).toFixed(1)} % / 95 %`
      : prochaineRecompense?.id === "empereur"
        ? `${Math.max(0, 500 - (profilImperial?.nombreActionsConformes ?? 0))} actions conformes restantes • ${(tauxConformite * 100).toFixed(1)} % / 98 %`
        : "Sommet de la progression HACCP atteint";

  if (chargement) {
    return (
      <View style={styles.etatCentre}>
        <ActivityIndicator color={OR} size="large" />
        <Text style={styles.texteSecondaire}>Ouverture des archives impériales…</Text>
      </View>
    );
  }

  if (!utilisateurActif || !profilImperial) {
    return (
      <View style={styles.etatCentre}>
        <Text style={styles.couronne}>♛</Text>
        <Text style={styles.titreEtat}>Aucun profil impérial actif</Text>
        <Text style={styles.texteSecondaire}>
          Sélectionnez un utilisateur pour consulter sa progression.
        </Text>
      </View>
    );
  }

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: apparition,
        transform: [{
          translateY: apparition.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        }],
      }}
    >
      <ScrollView
        contentContainerStyle={styles.contenu}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.surtitre}>EMPIRE RESTOPILOT</Text>
        <Text style={styles.titre}>Profil impérial</Text>

        <View style={styles.carteHero}>
          <View style={styles.ligneOrnement} />
          <Image source={avatar.image} style={styles.avatar} resizeMode="cover" />
          <Text style={styles.nom}>{utilisateurActif.nom}</Text>
          <Text style={styles.grade}>{profilImperial.grade}</Text>
          {avatar.title ? <Text style={styles.titreAvatar}>« {avatar.title} »</Text> : null}

          <View style={styles.niveauLigne}>
            <Text style={styles.niveau}>NIVEAU {profilImperial.niveau}</Text>
            <Text style={styles.points}>{profilImperial.pointsHaccp} pts HACCP</Text>
          </View>
          <View style={styles.barreFond}>
            <View style={[styles.barreProgression, { width: `${progression * 100}%` }]} />
          </View>
          <Text style={styles.progressionTexte}>
            {objectifProgression}
          </Text>
        </View>

        <Text style={styles.sectionTitre}>Récompenses obtenues</Text>
        {recompensesObtenues.length === 0 ? (
          <View style={styles.carteVide}>
            <Text style={styles.texteSecondaire}>
              Votre première distinction sera débloquée après la validation
              d’un relevé conforme.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recompensesObtenues.map((recompense) => (
              <Pressable
                key={recompense.id}
                accessibilityRole="button"
                accessibilityLabel={`Choisir l'avatar ${recompense.name}`}
                onPress={() => void changerAvatarUtilisateur(recompense.id)}
                style={[
                  styles.recompense,
                  profilImperial.avatarActuel === recompense.id
                    && styles.recompenseActive,
                ]}
              >
                <Image source={recompense.image} style={styles.miniAvatar} />
                <Text style={styles.recompenseNom}>{recompense.name}</Text>
                <Text style={styles.recompenseAction}>
                  {profilImperial.avatarActuel === recompense.id
                    ? "Avatar actuel"
                    : "Choisir cet avatar"}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitre}>Prochaine récompense</Text>
        <View style={styles.prochaineCarte}>
          {prochaineRecompense ? (
            <>
              <Image
                source={prochaineRecompense.image}
                style={styles.prochaineImage}
              />
              <View style={styles.prochaineContenu}>
                <Text style={styles.prochaineNom}>{prochaineRecompense.name}</Text>
                <Text style={styles.texteSecondaire}>
                  {objectifProgression}
                </Text>
                {prochaineRecompense.title ? (
                  <Text style={styles.prochaineTitre}>
                    {prochaineRecompense.title}
                  </Text>
                ) : null}
              </View>
            </>
          ) : (
            <Text style={styles.prochaineNom}>Toutes les distinctions HACCP sont acquises.</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        transparent
        animationType="fade"
        visible={Boolean(recompenseRecente)}
        onRequestClose={fermerNotificationRecompense}
      >
        <View style={styles.modalFond}>
          <View style={styles.modalCarte}>
            <Text style={styles.modalCelebration}>🎉 NOUVELLE RÉCOMPENSE !</Text>
            {recompenseRecente ? (
              <>
                <Image source={recompenseRecente.image} style={styles.modalImage} />
                <Text style={styles.modalLabel}>Avatar débloqué</Text>
                <Text style={styles.modalNom}>👑 {recompenseRecente.name.toUpperCase()}</Text>
                {recompenseRecente.title ? (
                  <>
                    <Text style={styles.modalLabel}>Titre</Text>
                    <Text style={styles.modalTitre}>« {recompenseRecente.title.toUpperCase()} »</Text>
                  </>
                ) : null}
              </>
            ) : null}
            <Pressable
              onPress={fermerNotificationRecompense}
              style={styles.modalBouton}
            >
              <Text style={styles.modalBoutonTexte}>Continuer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  etatCentre: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 28, backgroundColor: FOND },
  contenu: { padding: 20, paddingBottom: 48, backgroundColor: FOND },
  surtitre: { color: OR, fontSize: 12, fontWeight: "800", letterSpacing: 3, textAlign: "center" },
  titre: { color: "#FFF7DF", fontSize: 32, fontWeight: "800", textAlign: "center", marginTop: 6, marginBottom: 22 },
  couronne: { color: OR, fontSize: 52 },
  titreEtat: { color: OR_CLAIR, fontSize: 21, fontWeight: "800", textAlign: "center" },
  texteSecondaire: { color: "#B9AE99", fontSize: 14, lineHeight: 20, textAlign: "center" },
  carteHero: { backgroundColor: CARTE, borderWidth: 1, borderColor: "#765A22", borderRadius: 22, padding: 16, alignItems: "center", shadowColor: OR, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 7 },
  ligneOrnement: { width: 84, height: 2, backgroundColor: OR, marginBottom: 14 },
  avatar: { width: "100%", aspectRatio: 0.75, borderRadius: 15, borderWidth: 1, borderColor: OR },
  nom: { color: "#FFF8E7", fontSize: 25, fontWeight: "800", marginTop: 18, textAlign: "center" },
  grade: { color: OR_CLAIR, fontSize: 16, fontWeight: "800", letterSpacing: 1.2, marginTop: 5, textAlign: "center" },
  titreAvatar: { color: "#C9B88E", fontSize: 14, fontStyle: "italic", marginTop: 7 },
  niveauLigne: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 22, marginBottom: 9 },
  niveau: { color: OR, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  points: { color: "#F5E8C6", fontSize: 13, fontWeight: "700" },
  barreFond: { width: "100%", height: 10, borderRadius: 5, backgroundColor: "#32281A", overflow: "hidden" },
  barreProgression: { height: "100%", borderRadius: 5, backgroundColor: OR },
  progressionTexte: { color: "#9F927B", fontSize: 12, marginTop: 8, textAlign: "center" },
  sectionTitre: { color: OR_CLAIR, fontSize: 20, fontWeight: "800", marginTop: 28, marginBottom: 13 },
  carteVide: { padding: 20, borderRadius: 15, borderWidth: 1, borderColor: "#40341F", backgroundColor: CARTE },
  recompense: { width: 160, marginRight: 12, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: "#40341F", backgroundColor: CARTE },
  recompenseActive: { borderColor: OR, backgroundColor: "#211A0F" },
  miniAvatar: { width: "100%", aspectRatio: 0.75, borderRadius: 10 },
  recompenseNom: { color: "#F7EBD0", fontSize: 13, fontWeight: "800", marginTop: 9, textAlign: "center" },
  recompenseAction: { color: OR, fontSize: 11, marginTop: 5, textAlign: "center" },
  prochaineCarte: { minHeight: 112, flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: "#5D4823", backgroundColor: CARTE, overflow: "hidden" },
  prochaineImage: { width: 78, height: 104, borderRadius: 10, opacity: 0.72 },
  prochaineContenu: { flex: 1, paddingLeft: 14, alignItems: "flex-start" },
  prochaineNom: { color: OR_CLAIR, fontSize: 17, fontWeight: "800", marginBottom: 5 },
  prochaineTitre: { color: "#C6B78E", fontSize: 13, fontStyle: "italic", marginTop: 5 },
  modalFond: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(0,0,0,0.86)" },
  modalCarte: { width: "100%", maxWidth: 390, alignItems: "center", padding: 22, borderRadius: 22, borderWidth: 2, borderColor: OR, backgroundColor: "#100D09" },
  modalCelebration: { color: OR_CLAIR, fontSize: 22, fontWeight: "900", textAlign: "center", marginBottom: 16 },
  modalImage: { width: 190, height: 250, borderRadius: 14, borderWidth: 1, borderColor: OR },
  modalLabel: { color: "#A99B80", fontSize: 12, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", marginTop: 15 },
  modalNom: { color: "#FFF5DA", fontSize: 19, fontWeight: "900", marginTop: 4, textAlign: "center" },
  modalTitre: { color: OR_CLAIR, fontSize: 16, fontStyle: "italic", marginTop: 4, textAlign: "center" },
  modalBouton: { width: "100%", padding: 14, borderRadius: 12, backgroundColor: OR, marginTop: 20 },
  modalBoutonTexte: { color: "#171008", fontSize: 16, fontWeight: "900", textAlign: "center" },
});
