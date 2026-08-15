import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import type {
  IdentiteValidation,
  ValidationAction,
} from "@/types/validation";


export type UtilisateurTrace = {
  id:string;
  nom:string;
  role:string;
  date:string;
};

export type PeriodeReleve = "matin" | "soir";

export const HORAIRE_RELEVE_MATIN = "08:00";
export const HORAIRE_RELEVE_SOIR = "18:00";
const TOLERANCE_CRENEAU_MINUTES = 30;

export type ReleveTemperature = {
  id:number;
  pointControleId?:string;
  periode:PeriodeReleve;
  date:string;
  heure:string;
  temperature:string;
  responsable:string;
  conforme:boolean;
  photo?:string;
  commentaireAnomalie?:string;
  actionCorrective?:string;
  anomalieTraitee?:boolean;
  heurePrevue?:string;
  dansCreneau?:boolean;
  effectuePar?:UtilisateurTrace;
  validePar?:UtilisateurTrace;
  signePar?:UtilisateurTrace;
  dateValidation?:string;
  validation?:ValidationAction;
  dateSignature?:string;
};

export type TraceabiliteProduit = {
  id:number;
  produit:string;
  fournisseur:string;
  dateReception:string;
  dlc:string;
  temperatureReception:string;
  lot:string;
  commentaire:string;
  photo:string;
  effectuePar?:UtilisateurTrace;
  validePar?:UtilisateurTrace;
  validation?:ValidationAction;
};

export type ActionCorrective = {
  id:number;
  probleme:string;
  action:string;
  responsable:string;
  date:string;
  resolution:string;
  commentaire?:string;
  photoPreuve?:string;
  effectuePar?:UtilisateurTrace;
};

export type ReglagesNotifications = {
  active:boolean;
  matinHeure:string;
  soirHeure:string;
  ids:string[];
};

export type ScoreHaccp = {
  totalPoints:number;
  nombreReleves:number;
  nombreConformes:number;
  nombrePhotos:number;
  relevesConformes:number;
  grade:GradeHaccp;
  recompensesDebloquees:GradeHaccp[];
  oublisCritiques:number;
};

export type GradeHaccp = "PADAWAN HACCP" | "MONSTRE HACCP" | "EMPEREUR HACCP";

export type CategoriePointControle = "Froid positif" | "Froid négatif" | "Chaud" | "Refroidissement" | "Autre";

export type FrequenceControle = "matin" | "soir" | "matin-soir";

export type PointControleTemperature = {
  id: string;
  nom: string;
  emplacement: string;
  categorie: CategoriePointControle;
  temperatureMin?: number;
  temperatureMax?: number;
  frequence: FrequenceControle;
  actif: boolean;
  responsablesAssignes: string[];
};

type DonneesHaccp = {
  releves:ReleveTemperature[];
  traces:TraceabiliteProduit[];
  actions:ActionCorrective[];
  pointsControle:PointControleTemperature[];
  notifications:ReglagesNotifications;
  score:number;
  scoreHaccp:ScoreHaccp;
};

type HaccpContextType = DonneesHaccp & {
  ajouterReleve:(releve:Omit<ReleveTemperature,"id">) => Promise<void>;
  ajouterTrace:(trace:Omit<TraceabiliteProduit,"id">) => Promise<void>;
  ajouterAction:(action:Omit<ActionCorrective,"id">) => Promise<void>;
  ajouterPointControle:(point:Omit<PointControleTemperature,"id">) => Promise<void>;
  modifierPointControle:(id:string, point:Omit<PointControleTemperature,"id">) => Promise<void>;
  supprimerPointControle:(id:string) => Promise<void>;
  validerReleve:(id:number, identite?:IdentiteValidation) => Promise<boolean>;
  validerActionCorrective:(id:number, identite?:IdentiteValidation) => Promise<boolean>;
  signerRapportHaccp:() => Promise<boolean>;
  configurerNotifications:(reglages:Pick<ReglagesNotifications,"active" | "matinHeure" | "soirHeure">) => Promise<boolean>;
  obtenirMesControles:() => PointControleTemperature[];
  obtenirReleve:(id:number) => ReleveTemperature | undefined;
  modifierReleve:(id:number, releve:Partial<Omit<ReleveTemperature,"id">>) => Promise<void>;
};

const STOCKAGE_HACCP_PREFIX = "RESTOPILOT_HACCP_";

function obtenirCleStockageHaccp(entrepriseId: string): string {
  return `${STOCKAGE_HACCP_PREFIX}${entrepriseId}`;
}

const REGLAGES_DEFAUT:ReglagesNotifications = {
  active:false,
  matinHeure:HORAIRE_RELEVE_MATIN,
  soirHeure:HORAIRE_RELEVE_SOIR,
  ids:[],
};

const DONNEES_DEFAUT:DonneesHaccp = {
  releves:[],
  traces:[],
  actions:[],
  pointsControle:[],
  notifications:REGLAGES_DEFAUT,
  score:0,
  scoreHaccp:{
    totalPoints:0,
    nombreReleves:0,
    nombreConformes:0,
    nombrePhotos:0,
    relevesConformes:0,
    grade:"PADAWAN HACCP",
    recompensesDebloquees:[],
    oublisCritiques:0,
  },
};

const HaccpContext = createContext<HaccpContextType | null>(null);

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification:async () => ({
      shouldShowBanner:true,
      shouldShowList:true,
      shouldPlaySound:true,
      shouldSetBadge:false,
    }),
  });
}


function lireHeure(heure:string){

  const [heures, minutes] = heure.split(":").map(Number);

  if (
    !Number.isInteger(heures) ||
    !Number.isInteger(minutes) ||
    heures < 0 ||
    heures > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { heures, minutes };

}


export function HaccpProvider({ children }:{ children:React.ReactNode }) {

  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif, verifierPermission } = useUser();
  const { validerAction } = useValidation();

  function creerTraceUtilisateur() {
    if (!utilisateurActif) {
      return undefined;
    }

    return {
      id: utilisateurActif.id,
      nom: utilisateurActif.nom,
      role: utilisateurActif.role,
      date: new Date().toLocaleDateString("fr-FR"),
    } satisfies UtilisateurTrace;
  }

  const [donnees, setDonnees] = useState<DonneesHaccp>(DONNEES_DEFAUT);


  useEffect(() => {

    if (entrepriseActive) {
      chargerHaccp();
    } else {
      setDonnees(DONNEES_DEFAUT);
    }

  }, [entrepriseActive?.id]);


  async function chargerHaccp(){

    if (!entrepriseActive) {
      return;
    }

    try {

      const cleStockage = obtenirCleStockageHaccp(entrepriseActive.id);
      const stockage = await AsyncStorage.getItem(cleStockage);

      if (!stockage) {
        return;
      }

      const donneesChargees = JSON.parse(stockage) as Partial<DonneesHaccp>;
      const scoreHaccpCharge:ScoreHaccp = {
        ...DONNEES_DEFAUT.scoreHaccp,
        ...donneesChargees.scoreHaccp,
        totalPoints:donneesChargees.scoreHaccp?.totalPoints ?? donneesChargees.score ?? 0,
        nombreReleves:donneesChargees.scoreHaccp?.nombreReleves ?? donneesChargees.releves?.length ?? 0,
        nombreConformes:donneesChargees.scoreHaccp?.nombreConformes ?? donneesChargees.releves?.filter((releve) => releve.conforme).length ?? 0,
        nombrePhotos:donneesChargees.scoreHaccp?.nombrePhotos ?? donneesChargees.releves?.filter((releve) => Boolean(releve.photo)).length ?? 0,
        relevesConformes:donneesChargees.scoreHaccp?.relevesConformes ?? donneesChargees.scoreHaccp?.nombreConformes ?? donneesChargees.releves?.filter((releve) => releve.conforme).length ?? 0,
        grade:donneesChargees.scoreHaccp?.grade ?? determinerGrade({
          relevesConformes:donneesChargees.scoreHaccp?.relevesConformes ?? donneesChargees.scoreHaccp?.nombreConformes ?? donneesChargees.releves?.filter((releve) => releve.conforme).length ?? 0,
          nombreReleves:donneesChargees.scoreHaccp?.nombreReleves ?? donneesChargees.releves?.length ?? 0,
          oublisCritiques:donneesChargees.scoreHaccp?.oublisCritiques ?? 0,
        }),
        recompensesDebloquees:donneesChargees.scoreHaccp?.recompensesDebloquees ?? [],
        oublisCritiques:donneesChargees.scoreHaccp?.oublisCritiques ?? 0,
      };
      const donneesNormalisees:DonneesHaccp = {
        releves:donneesChargees.releves || [],
        traces:donneesChargees.traces || [],
        actions:donneesChargees.actions || [],
        pointsControle:donneesChargees.pointsControle || [],
        notifications:{
          ...REGLAGES_DEFAUT,
          ...donneesChargees.notifications,
          matinHeure:HORAIRE_RELEVE_MATIN,
          soirHeure:HORAIRE_RELEVE_SOIR,
          ids:donneesChargees.notifications?.ids || [],
        },
        score:donneesChargees.score ?? scoreHaccpCharge.totalPoints,
        scoreHaccp:scoreHaccpCharge,
      };

      setDonnees(donneesNormalisees);

    } catch(error) {

      console.error(error);

    }

  }


  async function sauvegarder(nouvellesDonnees:DonneesHaccp){

    if (!entrepriseActive) {
      return;
    }

    setDonnees(nouvellesDonnees);
    const cleStockage = obtenirCleStockageHaccp(entrepriseActive.id);
    await AsyncStorage.setItem(cleStockage, JSON.stringify(nouvellesDonnees));

  }


  async function ajouterReleve(releve:Omit<ReleveTemperature,"id">){

    const traceUtilisateur = creerTraceUtilisateur();
    const points = calculerPointsReleve(releve);
    const progression = calculerProgressionHaccp(donnees.scoreHaccp, releve.conforme, !releve.conforme && Boolean(releve.photo), points);

    await sauvegarder({
      ...donnees,
      releves:[...donnees.releves, { id:Date.now(), ...releve, effectuePar: traceUtilisateur }],
      score:donnees.score + points + progression.pointsRecompense,
      scoreHaccp:progression.scoreHaccp,
    });

  }


  async function ajouterTrace(trace:Omit<TraceabiliteProduit,"id">){

    await sauvegarder({
      ...donnees,
      traces:[...donnees.traces, { id:Date.now(), ...trace, effectuePar: creerTraceUtilisateur() }],
    });

  }


  async function ajouterAction(action:Omit<ActionCorrective,"id">){

    await sauvegarder({
      ...donnees,
      actions:[...donnees.actions, { id:Date.now(), ...action, effectuePar: creerTraceUtilisateur() }],
    });

  }


  async function ajouterPointControle(point:Omit<PointControleTemperature,"id">){

    await sauvegarder({
      ...donnees,
      pointsControle:[...donnees.pointsControle, { id:Date.now().toString(), ...point, responsablesAssignes: point.responsablesAssignes || [] }],
    });

  }


  async function modifierPointControle(id:string, point:Omit<PointControleTemperature,"id">){

    const pointsControleModifies = donnees.pointsControle.map((p) =>
      p.id === id ? { id, ...point } : p
    );

    await sauvegarder({
      ...donnees,
      pointsControle:pointsControleModifies,
    });

  }


  async function supprimerPointControle(id:string){

    await sauvegarder({
      ...donnees,
      pointsControle:donnees.pointsControle.filter((p) => p.id !== id),
    });

  }


  async function validerReleve(id:number, identite?:IdentiteValidation){
    const identification = identite ?? (
      utilisateurActif
        ? { methodeValidation:"CLIC", utilisateurId:utilisateurActif.id } as const
        : undefined
    );

    if (!identification) {
      return false;
    }

    const validation = await validerAction({
      actionType:"HACCP_RELEVE_TEMPERATURE",
      actionId:id.toString(),
      ...identification,
    });

    if (!validation) {
      return false;
    }

    const relevésMisAJour = donnees.releves.map((releve) => {
      if (releve.id !== id) {
        return releve;
      }

      return {
        ...releve,
        validePar: {
          id: validation.valideParUtilisateurId,
          nom: validation.valideParNom,
          role: validation.valideParRole,
          date: validation.dateValidation,
        },
        dateValidation: validation.dateValidation,
        validation,
      };
    });

    await sauvegarder({
      ...donnees,
      releves: relevésMisAJour,
    });

    return true;
  }


  async function validerActionCorrective(
    id:number,
    identite?:IdentiteValidation
  ){
    const identification = identite ?? (
      utilisateurActif
        ? { methodeValidation:"CLIC", utilisateurId:utilisateurActif.id } as const
        : undefined
    );

    if (!identification) {
      return false;
    }

    const validation = await validerAction({
      actionType:"HACCP_ACTION_CORRECTIVE",
      actionId:id.toString(),
      ...identification,
    });

    if (!validation) {
      return false;
    }

    const actionsMisesAJour = donnees.actions.map((action) =>
      action.id === id
        ? {
            ...action,
            validePar: {
              id:validation.valideParUtilisateurId,
              nom:validation.valideParNom,
              role:validation.valideParRole,
              date:validation.dateValidation,
            },
            validation,
          }
        : action
    );

    await sauvegarder({
      ...donnees,
      actions:actionsMisesAJour,
    });

    return true;
  }


  async function signerRapportHaccp(){
    if (!verifierPermission("validationJournee") || !utilisateurActif) {
      return false;
    }

    const traceSignature: UtilisateurTrace = {
      id: utilisateurActif.id,
      nom: utilisateurActif.nom,
      role: utilisateurActif.role,
      date: new Date().toLocaleDateString("fr-FR"),
    };

    const relevesSigne = donnees.releves.map((releve) => ({
      ...releve,
      signePar: traceSignature,
      dateSignature: new Date().toLocaleDateString("fr-FR"),
    }));

    await sauvegarder({
      ...donnees,
      releves: relevesSigne,
    });

    return true;
  }


  async function annulerRappels(ids:string[]){

    await Promise.all(
      ids.map(async (id) => {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch {
          // Un rappel déjà supprimé ne bloque pas la mise à jour des réglages.
        }
      })
    );

  }


  async function configurerNotifications(
    reglages:Pick<ReglagesNotifications,"active" | "matinHeure" | "soirHeure">
  ){

    const reglagesFixes = {
      active:reglages.active,
      matinHeure:HORAIRE_RELEVE_MATIN,
      soirHeure:HORAIRE_RELEVE_SOIR,
    };

    await annulerRappels(donnees.notifications.ids);

    if (!reglagesFixes.active || Platform.OS === "web") {

      await sauvegarder({
        ...donnees,
        notifications:{ ...reglagesFixes, active:false, ids:[] },
      });

      return false;

    }

    const matin = lireHeure(reglagesFixes.matinHeure);
    const soir = lireHeure(reglagesFixes.soirHeure);

    if (!matin || !soir) {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("haccp-rappels", {
        name:"Rappels HACCP",
        importance:Notifications.AndroidImportance.DEFAULT,
      });
    }

    let permission = await Notifications.getPermissionsAsync();

    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }

    if (permission.status !== "granted") {
      await sauvegarder({
        ...donnees,
        notifications:{ ...reglagesFixes, active:false, ids:[] },
      });

      return false;
    }

    const message = "🌡️ Rappel HACCP : pensez à effectuer votre relevé de température.";

    const matinId = await Notifications.scheduleNotificationAsync({
      content:{
        title:"🌅 Rappel température matin",
        body:message,
        sound:"default",
      },
      trigger:{
        type:Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:matin.heures,
        minute:matin.minutes,
        ...(Platform.OS === "android" ? { channelId:"haccp-rappels" } : {}),
      },
    });

    const soirId = await Notifications.scheduleNotificationAsync({
      content:{
        title:"🌙 Rappel température soir",
        body:message,
        sound:"default",
      },
      trigger:{
        type:Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:soir.heures,
        minute:soir.minutes,
        ...(Platform.OS === "android" ? { channelId:"haccp-rappels" } : {}),
      },
    });

    await sauvegarder({
      ...donnees,
      notifications:{ ...reglagesFixes, active:true, ids:[matinId, soirId] },
    });

    return true;

  }


  function obtenirMesControles(): PointControleTemperature[] {
    if (!utilisateurActif) {
      return [];
    }

    // GERANT voit tous les contrôles
    if (utilisateurActif.role === "GERANT") {
      return donnees.pointsControle.filter((p) => p.actif);
    }

    // Les autres rôles ne voient que les contrôles qui leur sont assignés
    return donnees.pointsControle.filter(
      (p) => p.actif && p.responsablesAssignes.includes(utilisateurActif.id)
    );
  }


  function obtenirReleve(id: number): ReleveTemperature | undefined {
    return donnees.releves.find((r) => r.id === id);
  }


  async function modifierReleve(id: number, releve: Partial<Omit<ReleveTemperature, "id">>): Promise<void> {
    const relevesModifies = donnees.releves.map((r) => {
      if (r.id !== id) {
        return r;
      }

      return {
        ...r,
        ...releve,
      };
    });

    await sauvegarder({
      ...donnees,
      releves: relevesModifies,
    });
  }


  return (
    <HaccpContext.Provider
      value={{
        ...donnees,
        ajouterReleve,
        ajouterTrace,
        ajouterAction,
        ajouterPointControle,
        modifierPointControle,
        supprimerPointControle,
        validerReleve,
        validerActionCorrective,
        signerRapportHaccp,
        configurerNotifications,
        obtenirMesControles,
        obtenirReleve,
        modifierReleve,
      }}
    >
      {children}
    </HaccpContext.Provider>
  );

}

export function calculerPointsReleve(
  releve:Pick<ReleveTemperature,"conforme" | "photo" | "anomalieTraitee">
){
  const pointsReleve = 5;
  const pointsConformite = releve.conforme ? 2 : 0;
  const pointsAnomalie = !releve.conforme && releve.anomalieTraitee ? 5 : 0;
  const pointsPreuve = !releve.conforme && releve.photo ? 3 : 0;

  return pointsReleve + pointsConformite + pointsAnomalie + pointsPreuve;
}

function determinerGrade({
  relevesConformes,
  nombreReleves,
  oublisCritiques,
}:{ relevesConformes:number; nombreReleves:number; oublisCritiques:number }):GradeHaccp {
  const tauxConformite = nombreReleves === 0 ? 0 : (relevesConformes / nombreReleves) * 100;

  if (relevesConformes >= 500 && tauxConformite >= 98 && oublisCritiques === 0) {
    return "EMPEREUR HACCP";
  }

  if (relevesConformes >= 100 && tauxConformite >= 95) {
    return "MONSTRE HACCP";
  }

  return "PADAWAN HACCP";
}

export function calculerProgressionHaccp(
  scoreHaccp:ScoreHaccp,
  releveConforme:boolean,
  releveAvecPhoto:boolean,
  pointsValidation:number
){
  const relevesConformes = scoreHaccp.relevesConformes + (releveConforme ? 1 : 0);
  const nombreReleves = scoreHaccp.nombreReleves + 1;
  const grade = determinerGrade({ relevesConformes, nombreReleves, oublisCritiques:scoreHaccp.oublisCritiques });
  const recompensesDebloquees = [...scoreHaccp.recompensesDebloquees];
  let recompenseDebloquee:GradeHaccp | undefined;
  let pointsRecompense = 0;

  if (releveConforme && !recompensesDebloquees.includes("PADAWAN HACCP") && relevesConformes >= 1) {
    recompenseDebloquee = "PADAWAN HACCP";
    pointsRecompense = 10;
  } else if (grade === "MONSTRE HACCP" && !recompensesDebloquees.includes("MONSTRE HACCP")) {
    recompenseDebloquee = "MONSTRE HACCP";
    pointsRecompense = 50;
  } else if (grade === "EMPEREUR HACCP" && !recompensesDebloquees.includes("EMPEREUR HACCP")) {
    recompenseDebloquee = "EMPEREUR HACCP";
    pointsRecompense = 200;
  }

  if (recompenseDebloquee) {
    recompensesDebloquees.push(recompenseDebloquee);
  }

  return {
    pointsRecompense,
    recompenseDebloquee,
    scoreHaccp:{
      ...scoreHaccp,
      totalPoints:scoreHaccp.totalPoints + pointsValidation + pointsRecompense,
      nombreReleves,
      nombreConformes:scoreHaccp.nombreConformes + (releveConforme ? 1 : 0),
      nombrePhotos:scoreHaccp.nombrePhotos + (releveAvecPhoto ? 1 : 0),
      relevesConformes,
      grade,
      recompensesDebloquees,
    },
  };
}

export function obtenirStatutCreneau(periode:PeriodeReleve, maintenant:Date){
  const heurePrevue = periode === "matin" ? HORAIRE_RELEVE_MATIN : HORAIRE_RELEVE_SOIR;
  const [heuresPrevues, minutesPrevues] = heurePrevue.split(":").map(Number);
  const minutesReelles = maintenant.getHours() * 60 + maintenant.getMinutes();
  const minutesAttendues = heuresPrevues * 60 + minutesPrevues;

  return {
    heurePrevue,
    dansCreneau:Math.abs(minutesReelles - minutesAttendues) <= TOLERANCE_CRENEAU_MINUTES,
  };
}


export function useHaccp(){

  const context = useContext(HaccpContext);

  if (!context) {
    throw new Error("useHaccp doit être utilisé dans HaccpProvider");
  }

  return context;

}
