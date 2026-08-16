import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { rewards } from "@/constants/rewards";
import { obtenirCleStockageClassementImperial } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useDocuments } from "@/context/DocumentContext";
import { router, type Href } from "expo-router";
import { useClotureJournee } from "@/context/ClotureJourneeContext";
import { useHaccp } from "@/context/HaccpContext";
import { usePointagePad } from "@/context/PointagePadContext";
import { usePlanning } from "@/context/PlanningContext";
import { useRewards } from "@/context/RewardContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import { useValidationHeures } from "@/context/ValidationHeuresContext";
import { construirePresenceJournee } from "@/services/tempsTravailService";
import type {
  AlerteDashboard,
  DashboardEntreprise,
  MembreEquipeImperiale,
  StatutJournee,
} from "@/types/dashboard";

const OR = "#D6A945";
const OR_CLAIR = "#F4D887";
const FOND = "#080706";
const CARTE = "#15120D";
const BORDURE = "#51401F";

function formaterDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

function formaterDateIso(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function dateIsoVersDateFr(dateIso: string): string {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  return new Date(annee, mois - 1, jour).toLocaleDateString("fr-FR");
}

function dateExploitationLongue(dateIso: string): string {
  const [annee, mois, jour] = dateIso.split("-").map(Number);
  const texte = new Date(annee, mois - 1, jour).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

function libelleStatut(statut: StatutJournee) {
  if (statut === "ANOMALIES_CRITIQUES") return "🔴 Anomalies critiques";
  if (statut === "ACTIONS_EN_ATTENTE") return "🟠 Actions en attente";
  return "🟢 Journée conforme";
}

function pluriel(nombre: number, singulier: string, plurielTexte: string) {
  return `${nombre} ${nombre > 1 ? plurielTexte : singulier}`;
}

function formaterMinutes(minutes: number) {
  return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`;
}

export default function DashboardGerant() {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurs } = useUser();
  const { documents, obtenirAlertesDocuments } = useDocuments();
  const {
    releves,
    actions,
    pointsControle,
    scoreHaccp,
  } = useHaccp();
  const { validations } = useValidation();
  const { obtenirProfilImperial } = useRewards();
  const { obtenirPointagesGerant } = usePointagePad();
  const { obtenirComparaisonPlanningPointage, obtenirPlanningEntreprise } = usePlanning();
  const { creerValidationMensuelle, obtenirValidationMensuelle, obtenirSyntheseMois } = useValidationHeures();
  const {
    clotureExploitation,
    terminerExploitation,
    cloturerJournee,
    rouvrirExceptionnellement,
  } = useClotureJournee();
  const [classementActif, setClassementActif] = useState(true);
  const maintenant = new Date();
  const moisValidation = maintenant.getMonth() + 1;
  const anneeValidation = maintenant.getFullYear();
  const validationHeures = obtenirValidationMensuelle(moisValidation, anneeValidation);
  const syntheseHeures = obtenirSyntheseMois(moisValidation, anneeValidation);
  const apparition = useRef(new Animated.Value(0)).current;
  const dateIso = clotureExploitation?.dateDebutExploitation
    ?? formaterDateIso(new Date());
  const dateFr = clotureExploitation
    ? dateIsoVersDateFr(clotureExploitation.dateDebutExploitation)
    : formaterDateFr(new Date());

  useEffect(() => {
    Animated.timing(apparition, {
      toValue: 1,
      duration: 420,
      useNativeDriver: true,
    }).start();
  }, [apparition]);

  useEffect(() => {
    if (!validationHeures) void creerValidationMensuelle(moisValidation, anneeValidation);
  }, [anneeValidation, moisValidation, validationHeures]);

  useEffect(() => {
    void chargerReglageClassement();
  }, [entrepriseActive?.id]);

  async function chargerReglageClassement() {
    if (!entrepriseActive) return;

    try {
      const valeur = await AsyncStorage.getItem(
        obtenirCleStockageClassementImperial(entrepriseActive.id)
      );
      setClassementActif(valeur === null ? true : valeur === "true");
    } catch (error) {
      console.error("Erreur chargement classement impérial", error);
    }
  }

  async function modifierClassement(active: boolean) {
    if (!entrepriseActive) return;
    setClassementActif(active);

    try {
      await AsyncStorage.setItem(
        obtenirCleStockageClassementImperial(entrepriseActive.id),
        String(active)
      );
    } catch (error) {
      console.error("Erreur sauvegarde classement impérial", error);
      setClassementActif(!active);
    }
  }

  const dashboard = useMemo<DashboardEntreprise | undefined>(() => {
    if (!entrepriseActive) return undefined;

    const relevesDuJour = releves.filter((releve) => releve.date === dateFr);
    const actionsDuJour = actions.filter((action) => action.date === dateFr);
    const pointsActifs = pointsControle.filter((point) => point.actif);
    const controlesAttendus = pointsActifs
      .filter((point) => point.obligatoire && point.frequence === "QUOTIDIEN")
      .map((point) => point.id);
    const controlesRealises = new Set(
      relevesDuJour
        .filter((releve) => releve.pointControleId)
        .map((releve) => releve.pointControleId as string)
    );
    const relevesManquants = controlesAttendus.filter(
      (controle) => !controlesRealises.has(controle)
    ).length;
    const actionEstValidee = (actionId: number) => validations.some(
      (validation) =>
        validation.actionType === "HACCP_ACTION_CORRECTIVE"
        && validation.actionId === actionId.toString()
    );
    const releveEstValide = (releveId: number) => validations.some(
      (validation) =>
        validation.actionType === "HACCP_RELEVE_TEMPERATURE"
        && validation.actionId === releveId.toString()
    );
    const actionsCorrectivesOuvertes = actions.filter(
      (action) => !actionEstValidee(action.id)
    ).length;
    const actionsNonValidees = actionsDuJour.filter(
      (action) => !actionEstValidee(action.id)
    ).length;
    const anomaliesOuvertes = relevesDuJour.filter(
      (releve) => !releve.conforme && !releve.anomalieTraitee
    ).length;
    const validationsEnAttente = relevesDuJour.filter(
      (releve) => !releveEstValide(releve.id)
    ).length + actionsNonValidees;
    const alertes: AlerteDashboard[] = [
      {
        id: "releves-manquants",
        type: "RELEVES_MANQUANTS",
        niveau: relevesManquants > 0 ? "ATTENTION" : "INFO",
        message: `⚠️ ${pluriel(relevesManquants, "contrôle température manquant", "contrôles température manquants")}`,
        nombre: relevesManquants,
      },
      {
        id: "actions-non-validees",
        type: "ACTIONS_NON_VALIDEES",
        niveau: actionsNonValidees > 0 ? "ATTENTION" : "INFO",
        message: `🛠️ ${pluriel(actionsNonValidees, "action corrective non validée", "actions correctives non validées")}`,
        nombre: actionsNonValidees,
      },
      {
        id: "anomalies-ouvertes",
        type: "ANOMALIES_OUVERTES",
        niveau: anomaliesOuvertes > 0 ? "CRITIQUE" : "INFO",
        message: `🚨 ${pluriel(anomaliesOuvertes, "anomalie ouverte", "anomalies ouvertes")}`,
        nombre: anomaliesOuvertes,
      },
      {
        id: "validations-en-attente",
        type: "VALIDATIONS_EN_ATTENTE",
        niveau: validationsEnAttente > 0 ? "ATTENTION" : "INFO",
        message: `✍️ ${pluriel(validationsEnAttente, "validation responsable en attente", "validations responsables en attente")}`,
        nombre: validationsEnAttente,
      },
    ];
    const equipe: MembreEquipeImperiale[] = utilisateurs
      .filter(
        (utilisateur) =>
          utilisateur.entrepriseId === entrepriseActive.id
          && utilisateur.actif
          && utilisateur.role !== "GERANT"
      )
      .map((utilisateur) => {
        const profil = obtenirProfilImperial(utilisateur.id);
        const derniereAction = profil?.historiqueProgression.at(-1);
        const tauxConformite = profil?.nombreActionsEvaluees
          ? profil.nombreActionsConformes / profil.nombreActionsEvaluees
          : 0;

        return {
          utilisateurId: utilisateur.id,
          prenom: utilisateur.nom.trim().split(/\s+/)[0] || utilisateur.nom,
          avatarId: profil?.avatarActuel ?? "padawan",
          grade: profil?.grade ?? "PADAWAN HACCP",
          pointsHaccp: profil?.pointsHaccp ?? 0,
          tauxConformite,
          recompensesObtenues: profil?.recompensesDebloquees.length ?? 0,
          derniereAction: derniereAction?.description ?? "Aucune action enregistrée",
          dateDerniereAction: derniereAction?.date,
        };
      });
    const classement = [...equipe]
      .sort(
        (a, b) =>
          b.pointsHaccp - a.pointsHaccp
          || b.tauxConformite - a.tauxConformite
          || b.recompensesObtenues - a.recompensesObtenues
      )
      .map((membre, index) => ({ ...membre, position: index + 1 }));
    const statutJournee: StatutJournee = anomaliesOuvertes > 0
      ? "ANOMALIES_CRITIQUES"
      : relevesManquants + actionsNonValidees + validationsEnAttente > 0
        ? "ACTIONS_EN_ATTENTE"
        : "CONFORME";

    return {
      entrepriseId: entrepriseActive.id,
      scoreHaccp: {
        total: scoreHaccp.totalPoints,
        nombreReleves: scoreHaccp.nombreReleves,
        tauxConformite: scoreHaccp.nombreReleves === 0
          ? 0
          : scoreHaccp.nombreConformes / scoreHaccp.nombreReleves,
        nombrePhotos: scoreHaccp.nombrePhotos,
        actionsCorrectivesOuvertes,
      },
      alertes,
      equipe,
      classement,
      statutJournee,
    };
  }, [
    entrepriseActive,
    releves,
    actions,
    pointsControle,
    scoreHaccp,
    validations,
    utilisateurs,
    dateFr,
    obtenirProfilImperial,
  ]);

  if (!entrepriseActive || !dashboard) {
    return (
      <View style={styles.etatVide}>
        <Text style={styles.titreCarte}>Aucune entreprise active</Text>
      </View>
    );
  }

  const pointagesDuJour = obtenirPointagesGerant(dateIso);
  const comparaisonTemps = obtenirComparaisonPlanningPointage(dateIso, pointagesDuJour);
  const totalTempsPrevu = comparaisonTemps.reduce((total, element) => total + element.tempsPrevu, 0);
  const totalTempsReel = comparaisonTemps.reduce((total, element) => total + element.tempsReel, 0);
  const totalEcart = totalTempsReel - totalTempsPrevu;
  const heuresSupplementairesPotentielles = comparaisonTemps.reduce((total, element) => total + Math.max(0, element.ecart), 0);
  const salariesActifs = new Set(
    pointagesDuJour.map((pointage) => pointage.utilisateurId)
  ).size;
  const planningDuMois = obtenirPlanningEntreprise(
    maintenant.getMonth() + 1,
    maintenant.getFullYear()
  );
  const presencesDuJour = utilisateurs.flatMap((utilisateur) => {
    if (
      utilisateur.entrepriseId !== entrepriseActive.id
      || !utilisateur.actif
      || utilisateur.role === "GERANT"
    ) return [];
    const ligne = planningDuMois?.lignes.find(
      (element) => element.utilisateurId === utilisateur.id
    );
    const jour = ligne?.jours.find((element) => element.date === dateIso);
    const pointagesUtilisateur = pointagesDuJour.filter(
      (pointage) => pointage.utilisateurId === utilisateur.id
    );
    if (!jour?.matin.heureDebut && !jour?.soir.heureDebut && pointagesUtilisateur.length === 0) {
      return [];
    }
    return [construirePresenceJournee({
      entrepriseId: entrepriseActive.id,
      utilisateurId: utilisateur.id,
      date: dateIso,
      jour,
      pointages: pointagesUtilisateur,
    })];
  });
  const presentsAujourdHui = presencesDuJour.filter(
    (presence) => presence.statut !== "NON_ARRIVE"
  ).length;
  const absentsAujourdHui = presencesDuJour.filter(
    (presence) => presence.statut === "NON_ARRIVE"
  ).length;
  const retardsAujourdHui = presencesDuJour.filter(
    (presence) => Boolean(presence.arrivee && presence.horairePrevu)
      && presence.ecartMinutes > 0
  ).length;
  const enServiceActuellement = presencesDuJour.filter(
    (presence) => presence.statut === "EN_SERVICE"
  ).length;
  const soldesPointage = new Map<string, number>();
  pointagesDuJour.forEach((pointage) => {
    const variation = pointage.type === "ARRIVEE" ? 1 : -1;
    soldesPointage.set(
      pointage.utilisateurId,
      (soldesPointage.get(pointage.utilisateurId) ?? 0) + variation
    );
  });
  const pointageControle = [...soldesPointage.values()].every(
    (solde) => solde === 0
  );
  const actionsRealisees = releves.filter((releve) => releve.date === dateFr).length
    + actions.filter((action) => action.date === dateFr).length;
  const validationsNecessaires = dashboard.alertes.find(
    (alerte) => alerte.type === "VALIDATIONS_EN_ATTENTE"
  )?.nombre ?? 0;
  const actionsEnAttente = dashboard.alertes
    .filter((alerte) => alerte.type !== "VALIDATIONS_EN_ATTENTE")
    .reduce((total, alerte) => total + alerte.nombre, 0);
  const relevesManquants = dashboard.alertes.find(
    (alerte) => alerte.type === "RELEVES_MANQUANTS"
  )?.nombre ?? 0;
  const anomaliesOuvertes = dashboard.alertes.find(
    (alerte) => alerte.type === "ANOMALIES_OUVERTES"
  )?.nombre ?? 0;
  const haccpControle = relevesManquants === 0;
  const anomaliesControlees = anomaliesOuvertes === 0;
  const actionsObligatoiresControlees = haccpControle
    && pointageControle
    && anomaliesControlees
    && validationsNecessaires === 0;
  const resumeCloture = {
    services: (clotureExploitation?.services ?? []).map((service) => ({
      ...service,
      controle: clotureExploitation?.statut !== "OUVERTE",
    })),
    controles: {
      haccp: haccpControle,
      planning: true,
      pointage: pointageControle,
      anomalies: anomaliesControlees,
      actionsObligatoiresControlees,
    },
  };
  const alertesDocuments = obtenirAlertesDocuments();
  const documentsExpires = documents.filter((document) => document.statut === "EXPIRE").length;
  const documentsASurveiller = documents.filter((document) => document.statut === "A_SURVEILLER").length;

  async function handleTerminerExploitation() {
    const succes = await terminerExploitation(resumeCloture);
    if (!succes) {
      Alert.alert("Clôture", "Impossible de terminer cette exploitation.");
    }
  }

  async function handleCloturerJournee() {
    const succes = await cloturerJournee(resumeCloture);
    Alert.alert(
      succes ? "Journée clôturée" : "Contrôles incomplets",
      succes
        ? "La journée d’exploitation est définitivement validée."
        : "Toutes les actions obligatoires doivent être contrôlées avant validation."
    );
  }

  return (
    <Animated.View style={[styles.racine, { opacity: apparition }]}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.surtitre}>COMMANDERIE RESTOPILOT</Text>
        <Text style={styles.titre}>Dashboard Gérant</Text>

        <View style={styles.carteEntreprise}>
          {entrepriseActive.logo ? (
            <Image source={{ uri: entrepriseActive.logo }} style={styles.logo} />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoTexte}>{entrepriseActive.nom.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.entrepriseContenu}>
            <Text style={styles.nomEntreprise}>{entrepriseActive.nom}</Text>
            <Text style={styles.metaEntreprise}>
              {pluriel(dashboard.equipe.length, "salarié", "salariés")} • {salariesActifs} actif(s) aujourd’hui
            </Text>
            <View style={styles.badgeStatut}>
              <Text style={styles.badgeStatutTexte}>{libelleStatut(dashboard.statutJournee)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreCarte}>
          <Text style={styles.scoreCouronne}>👑</Text>
          <Text style={styles.scoreLabel}>Score Impérial HACCP</Text>
          <Text style={styles.scoreValeur}>{dashboard.scoreHaccp.total}</Text>
          <View style={styles.grilleStats}>
            <Stat label="Relevés" value={String(dashboard.scoreHaccp.nombreReleves)} />
            <Stat label="Conformité" value={`${(dashboard.scoreHaccp.tauxConformite * 100).toFixed(1)} %`} />
            <Stat label="Photos preuves" value={String(dashboard.scoreHaccp.nombrePhotos)} />
            <Stat label="Correctives ouvertes" value={String(dashboard.scoreHaccp.actionsCorrectivesOuvertes)} />
          </View>
        </View>

        <SectionTitre>⏱️ Présence équipe</SectionTitre>
        <Pressable style={styles.carteStandard} onPress={() => router.push("/presence-jour" as Href)}>
          <View style={styles.grilleStats}>
            <Stat label="Présents aujourd’hui" value={String(presentsAujourdHui)} />
            <Stat label="Absents" value={String(absentsAujourdHui)} />
            <Stat label="Retards" value={String(retardsAujourdHui)} />
            <Stat label="En service" value={String(enServiceActuellement)} />
          </View>
          <Text style={styles.lienDocuments}>Voir la présence de l’équipe aujourd’hui ›</Text>
        </Pressable>

        <SectionTitre>⏱️ Suivi des heures</SectionTitre>
        <Pressable style={styles.carteStandard} onPress={() => router.push("/planning/ecarts" as Href)}>
          <View style={styles.grilleStats}>
            <Stat label="Heures prévues" value={formaterMinutes(totalTempsPrevu)} />
            <Stat label="Heures réalisées" value={formaterMinutes(totalTempsReel)} />
            <Stat label="Écart" value={`${totalEcart >= 0 ? "+" : "-"}${formaterMinutes(Math.abs(totalEcart))}`} />
            <Stat label="Sup. potentielles" value={formaterMinutes(heuresSupplementairesPotentielles)} />
          </View>
          <Text style={styles.lienDocuments}>Voir l’analyse du jour ›</Text>
        </Pressable>

        <SectionTitre>⏱️ Validation des heures</SectionTitre>
        <Pressable style={styles.carteStandard} onPress={() => router.push("/planning/validation-heures" as Href)}>
          <View style={styles.grilleStats}>
            <Stat label="Mois en cours" value={new Date(anneeValidation, moisValidation - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })} />
            <Stat label="Heures en attente" value={formaterMinutes(syntheseHeures?.totalRealiseMinutes ?? 0)} />
            <Stat label="Statut" value={(validationHeures?.statut ?? "EN_COURS").replaceAll("_", " ")} />
          </View>
          <Text style={styles.lienDocuments}>Contrôler et valider le mois ›</Text>
        </Pressable>

        <SectionTitre>Alertes du jour</SectionTitre>
        <View style={styles.carteStandard}>
          {dashboard.alertes.map((alerte) => (
            <View key={alerte.id} style={styles.alerteLigne}>
              <View style={[styles.pointAlerte, {
                backgroundColor: alerte.niveau === "CRITIQUE"
                  ? "#D65A50"
                  : alerte.niveau === "ATTENTION" ? "#E2A63B" : "#3E9B67",
              }]} />
              <Text style={styles.alerteTexte}>{alerte.message}</Text>
            </View>
          ))}
        </View>

        <SectionTitre>📄 Alertes documents</SectionTitre>
        <Pressable style={styles.carteStandard} onPress={() => router.push("/personnel/documents-alertes" as Href)}>
          {alertesDocuments.length === 0 ? <Text style={styles.texteSecondaire}>Aucun document à surveiller.</Text> : alertesDocuments.slice(0, 4).map((alerte) => {
            const salarie = utilisateurs.find((utilisateur) => utilisateur.id === alerte.document.utilisateurId);
            return <View key={alerte.document.id} style={styles.alerteLigne}><View style={[styles.pointAlerte, { backgroundColor: alerte.niveau === "EXPIRE" ? "#D65A50" : "#E2A63B" }]} /><View style={styles.documentAlerteContenu}><Text style={styles.alerteTexte}>{alerte.document.nom} - {salarie?.nom ?? "Salarié"}</Text><Text style={styles.documentAlerteDate}>Expire le {alerte.document.dateExpiration ? new Date(`${alerte.document.dateExpiration}T12:00:00`).toLocaleDateString("fr-FR") : "—"}</Text></View></View>;
          })}
          <Text style={styles.lienDocuments}>{documentsASurveiller} à surveiller · {documentsExpires} expiré(s) ›</Text>
        </Pressable>

        <SectionTitre>Équipe impériale</SectionTitre>
        {dashboard.equipe.length === 0 ? (
          <View style={styles.carteStandard}><Text style={styles.texteSecondaire}>Aucun salarié actif.</Text></View>
        ) : dashboard.equipe.map((membre) => (
          <MembreCarte key={membre.utilisateurId} membre={membre} />
        ))}

        <View style={styles.sectionAvecAction}>
          <SectionTitre>Classement Impérial</SectionTitre>
          <View style={styles.toggleLigne}>
            <Text style={styles.toggleLabel}>{classementActif ? "Activé" : "Désactivé"}</Text>
            <Switch
              value={classementActif}
              onValueChange={(active) => void modifierClassement(active)}
              trackColor={{ false: "#403A30", true: "#725A26" }}
              thumbColor={classementActif ? OR_CLAIR : "#9A9285"}
            />
          </View>
        </View>
        {classementActif ? (
          <View style={styles.carteStandard}>
            {dashboard.classement.map((membre) => (
              <View key={membre.utilisateurId} style={styles.classementLigne}>
                <Text style={styles.position}>{membre.position === 1 ? "🏆" : `#${membre.position}`}</Text>
                <Text style={styles.classementNom}>{membre.prenom}</Text>
                <View style={styles.classementScore}>
                  <Text style={styles.classementPoints}>{membre.pointsHaccp} pts</Text>
                  <Text style={styles.classementMeta}>{(membre.tauxConformite * 100).toFixed(1)} % • {membre.recompensesObtenues} 🏅</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.carteStandard}><Text style={styles.texteSecondaire}>Le classement est masqué pour cette entreprise.</Text></View>
        )}

        <SectionTitre>Clôture de journée</SectionTitre>
        <View style={styles.clotureCarte}>
          {clotureExploitation ? (
            <>
              <View style={styles.clotureEntete}>
                <Text style={styles.clotureTitre}>Résumé de la journée</Text>
                <Text style={styles.clotureStatut}>{clotureExploitation.statut.replaceAll("_", " ")}</Text>
              </View>
              <Text style={styles.clotureLabel}>Date exploitation</Text>
              <Text style={styles.clotureDate}>
                {dateExploitationLongue(clotureExploitation.dateDebutExploitation)}
              </Text>
              {clotureExploitation.dateFinExploitation ? (
                <Text style={styles.clotureFin}>
                  Fin réelle : {dateExploitationLongue(clotureExploitation.dateFinExploitation)} à {clotureExploitation.heureFinReelle}
                </Text>
              ) : null}

              <Text style={styles.clotureLabel}>Services</Text>
              {resumeCloture.services.map((service) => (
                <ResumeLigne
                  key={`${service.nom}-${service.heureDebut}`}
                  label={`${service.nom} · ${service.heureDebut}–${service.heureFin}`}
                  valide={service.controle}
                />
              ))}

              <Text style={styles.clotureLabel}>Contrôles</Text>
              <ResumeLigne label="HACCP" valide={resumeCloture.controles.haccp} />
              <ResumeLigne label="Planning" valide={resumeCloture.controles.planning} />
              <ResumeLigne label="Pointage" valide={resumeCloture.controles.pointage} />
              <ResumeLigne label="Anomalies" valide={resumeCloture.controles.anomalies} />

              <View style={styles.grilleStats}>
                <Stat label="Actions réalisées" value={String(actionsRealisees)} />
                <Stat label="Actions en attente" value={String(actionsEnAttente)} />
                <Stat label="Validations nécessaires" value={String(validationsNecessaires)} />
              </View>

              {clotureExploitation.statut === "OUVERTE"
                || clotureExploitation.statut === "ROUVERTE_EXCEPTIONNELLEMENT" ? (
                <Pressable style={styles.boutonSecondaire} onPress={() => void handleTerminerExploitation()}>
                  <Text style={styles.boutonSecondaireTexte}>Terminer le service</Text>
                </Pressable>
              ) : null}

              {clotureExploitation.statut === "EN_ATTENTE_VALIDATION" ? (
                <Pressable
                  style={[
                    styles.boutonCloture,
                    !actionsObligatoiresControlees && styles.boutonDesactive,
                  ]}
                  onPress={() => void handleCloturerJournee()}
                >
                  <Text style={styles.boutonClotureTexte}>Clôturer la journée</Text>
                </Pressable>
              ) : null}

              {clotureExploitation.statut === "VALIDEE" ? (
                <>
                  <Text style={styles.validationFinale}>
                    ✅ Validée le {clotureExploitation.valideeLe
                      ? new Date(clotureExploitation.valideeLe).toLocaleString("fr-FR")
                      : "—"}
                  </Text>
                  <Pressable
                    style={styles.boutonException}
                    onPress={() => void rouvrirExceptionnellement(clotureExploitation.id)}
                  >
                    <Text style={styles.boutonExceptionTexte}>Rouvrir exceptionnellement</Text>
                  </Pressable>
                </>
              ) : null}

              <View style={styles.notificationBadge}>
                <Text style={styles.notificationTitre}>👑 L’Empire veille sur votre journée</Text>
                <Text style={styles.notificationTexte}>
                  Rappel à 22h : votre journée d’exploitation devra être validée avant clôture définitive.
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.texteSecondaire}>
              Aucune journée d’exploitation ouverte pour cette entreprise.
            </Text>
          )}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

function SectionTitre({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitre}>{children}</Text>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValeur}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ResumeLigne({ label, valide }: { label: string; valide: boolean }) {
  return (
    <View style={styles.resumeLigne}>
      <Text style={styles.resumeLabel}>{label}</Text>
      <Text style={valide ? styles.resumeValide : styles.resumeAttente}>
        {valide ? "✅" : "⏳"}
      </Text>
    </View>
  );
}

function MembreCarte({ membre }: { membre: MembreEquipeImperiale }) {
  const avatar = rewards.find((recompense) => recompense.id === membre.avatarId) ?? rewards[0];
  return (
    <View style={styles.membreCarte}>
      <Image source={avatar.image} style={styles.avatar} />
      <View style={styles.membreContenu}>
        <Text style={styles.membreNom}>👨‍🍳 {membre.prenom}</Text>
        <Text style={styles.membreGrade}>{membre.grade}</Text>
        <Text style={styles.membrePoints}>+{membre.pointsHaccp} points</Text>
        <Text style={styles.membreConformite}>🏆 {(membre.tauxConformite * 100).toFixed(1)} % conformité</Text>
        <Text style={styles.derniereAction} numberOfLines={1}>{membre.derniereAction}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  racine: { flex: 1, backgroundColor: FOND },
  contenu: { padding: 18, paddingBottom: 52 },
  etatVide: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: FOND },
  surtitre: { color: OR, fontSize: 11, fontWeight: "900", letterSpacing: 2.8, textAlign: "center" },
  titre: { color: "#FFF7E3", fontSize: 31, fontWeight: "900", textAlign: "center", marginTop: 6, marginBottom: 20 },
  carteEntreprise: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: BORDURE, backgroundColor: CARTE },
  logo: { width: 68, height: 68, borderRadius: 18 },
  logoFallback: { width: 68, height: 68, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: OR, backgroundColor: "#241B0D" },
  logoTexte: { color: OR_CLAIR, fontSize: 30, fontWeight: "900" },
  entrepriseContenu: { flex: 1, marginLeft: 14 },
  nomEntreprise: { color: "#FFF5DB", fontSize: 21, fontWeight: "900" },
  metaEntreprise: { color: "#AFA48E", fontSize: 12, marginTop: 4 },
  badgeStatut: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginTop: 9, backgroundColor: "#241E14" },
  badgeStatutTexte: { color: "#E9DDC1", fontSize: 12, fontWeight: "700" },
  scoreCarte: { alignItems: "center", marginTop: 16, padding: 18, borderRadius: 20, borderWidth: 1, borderColor: OR, backgroundColor: "#18130B", shadowColor: OR, shadowOpacity: 0.14, shadowRadius: 18, elevation: 6 },
  scoreCouronne: { fontSize: 28 },
  scoreLabel: { color: OR_CLAIR, fontSize: 16, fontWeight: "900", letterSpacing: 0.6, marginTop: 3 },
  scoreValeur: { color: "#FFFFFF", fontSize: 46, fontWeight: "900", marginVertical: 4 },
  grilleStats: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  stat: { minWidth: "47%", flexGrow: 1, padding: 11, borderRadius: 12, backgroundColor: "#0D0B08" },
  statValeur: { color: OR_CLAIR, fontSize: 18, fontWeight: "900", textAlign: "center" },
  statLabel: { color: "#978C78", fontSize: 11, marginTop: 3, textAlign: "center" },
  sectionTitre: { color: OR_CLAIR, fontSize: 20, fontWeight: "900", marginTop: 26, marginBottom: 11 },
  carteStandard: { padding: 14, borderRadius: 17, borderWidth: 1, borderColor: BORDURE, backgroundColor: CARTE },
  alerteLigne: { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#332A1B" },
  pointAlerte: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  alerteTexte: { flex: 1, color: "#E8DEC8", fontSize: 14 },
  texteSecondaire: { color: "#A89D88", textAlign: "center", lineHeight: 20 },
  membreCarte: { flexDirection: "row", marginBottom: 11, padding: 11, borderRadius: 17, borderWidth: 1, borderColor: BORDURE, backgroundColor: CARTE },
  avatar: { width: 84, height: 112, borderRadius: 12, borderWidth: 1, borderColor: OR },
  membreContenu: { flex: 1, paddingLeft: 13, justifyContent: "center" },
  membreNom: { color: "#FFF4D8", fontSize: 18, fontWeight: "900" },
  membreGrade: { color: OR_CLAIR, fontSize: 12, fontWeight: "800", marginTop: 4 },
  membrePoints: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", marginTop: 5 },
  membreConformite: { color: "#B7AC96", fontSize: 12, marginTop: 3 },
  derniereAction: { color: "#827968", fontSize: 11, fontStyle: "italic", marginTop: 7 },
  sectionAvecAction: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  toggleLigne: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  toggleLabel: { color: "#AFA48E", fontSize: 12, marginRight: 6 },
  classementLigne: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#352B1C" },
  position: { width: 38, color: OR_CLAIR, fontSize: 16, fontWeight: "900" },
  classementNom: { flex: 1, color: "#F8ECD2", fontSize: 15, fontWeight: "800" },
  classementScore: { alignItems: "flex-end" },
  classementPoints: { color: OR_CLAIR, fontSize: 14, fontWeight: "900" },
  classementMeta: { color: "#8E846F", fontSize: 10, marginTop: 2 },
  clotureCarte: { padding: 16, borderRadius: 19, borderWidth: 1, borderColor: OR, backgroundColor: "#17120B" },
  clotureEntete: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  clotureTitre: { color: "#FFF2D2", fontSize: 18, fontWeight: "900" },
  clotureStatut: { color: OR_CLAIR, fontSize: 9, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, backgroundColor: "#2A2112" },
  clotureLabel: { color: "#928773", fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 13, marginBottom: 5 },
  clotureDate: { color: OR_CLAIR, fontSize: 18, fontWeight: "900" },
  clotureFin: { color: "#AFA48E", fontSize: 12, marginTop: 5 },
  resumeLigne: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#372C1C" },
  resumeLabel: { color: "#E9DFC8", fontSize: 14 },
  resumeValide: { fontSize: 15 },
  resumeAttente: { fontSize: 15, opacity: 0.7 },
  boutonCloture: { marginTop: 16, padding: 15, borderRadius: 12, backgroundColor: OR },
  boutonDesactive: { opacity: 0.5 },
  boutonClotureTexte: { color: "#171008", fontSize: 16, fontWeight: "900", textAlign: "center" },
  boutonSecondaire: { marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: OR, backgroundColor: "#241C0E" },
  boutonSecondaireTexte: { color: OR_CLAIR, fontSize: 15, fontWeight: "800", textAlign: "center" },
  validationFinale: { color: "#78C995", fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 16 },
  boutonException: { alignSelf: "center", paddingVertical: 9, paddingHorizontal: 12, marginTop: 7 },
  boutonExceptionTexte: { color: "#B6AA93", fontSize: 12, textDecorationLine: "underline" },
  notificationBadge: { marginTop: 13, padding: 11, borderRadius: 10, backgroundColor: "#2A2112" },
  notificationTitre: { color: OR_CLAIR, fontSize: 12, fontWeight: "900", textAlign: "center" },
  notificationTexte: { color: "#B9AD95", fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: "center" },
  titreCarte: { color: OR_CLAIR, fontSize: 20, fontWeight: "900" },
  lienDocuments: { color: OR_CLAIR, fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 12 },
  documentAlerteContenu: { flex: 1 },
  documentAlerteDate: { color: "#918670", fontSize: 11, marginTop: 2 },
});
