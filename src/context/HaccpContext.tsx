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
import { useRewards } from "@/context/RewardContext";
import type {
  IdentiteValidation,
  ValidationAction,
} from "@/types/validation";
import type { ParametresAttributionPoints } from "@/types/reward";
import type {
  ControleRealise,
  PointControleHaccp,
} from "@/types/controleHaccp";


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
  controleRealiseId?:string;
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

export type PointControleTemperature = PointControleHaccp;

type DonneesHaccp = {
  releves:ReleveTemperature[];
  traces:TraceabiliteProduit[];
  actions:ActionCorrective[];
  pointsControle:PointControleHaccp[];
  controlesRealises:ControleRealise[];
  notifications:ReglagesNotifications;
  score:number;
  scoreHaccp:ScoreHaccp;
};

type HaccpContextType = DonneesHaccp & {
  ajouterReleve:(releve:Omit<ReleveTemperature,"id">) => Promise<void>;
  ajouterTrace:(trace:Omit<TraceabiliteProduit,"id">) => Promise<void>;
  ajouterAction:(action:Omit<ActionCorrective,"id">) => Promise<void>;
  ajouterPointControle:(point:Omit<PointControleHaccp,"id" | "entrepriseId" | "creePar" | "dateCreation">) => Promise<boolean>;
  modifierPointControle:(id:string, point:Partial<Omit<PointControleHaccp,"id" | "entrepriseId" | "creePar" | "dateCreation">>) => Promise<boolean>;
  supprimerPointControle:(id:string) => Promise<boolean>;
  obtenirPointsControleEntreprise:() => PointControleHaccp[];
  enregistrerControleRealise:(controle:Omit<ControleRealise,"id" | "entrepriseId" | "utilisateurId">) => Promise<ControleRealise | null>;
  validerControleRealise:(id:string, identite:IdentiteValidation) => Promise<boolean>;
  validerReleve:(id:number, identite?:IdentiteValidation) => Promise<boolean>;
  validerActionCorrective:(id:number, identite?:IdentiteValidation) => Promise<boolean>;
  signerRapportHaccp:() => Promise<boolean>;
  configurerNotifications:(reglages:Pick<ReglagesNotifications,"active" | "matinHeure" | "soirHeure">) => Promise<boolean>;
  obtenirMesControles:() => PointControleHaccp[];
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
  controlesRealises:[],
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

type AncienPointControle = Partial<PointControleHaccp> & {
  id:string;
  emplacement?:string;
  responsablesAssignes?:string[];
};

function normaliserPointControle(
  point:AncienPointControle,
  entrepriseId:string
):PointControleHaccp {
  const frequence = point.frequence === "QUOTIDIEN"
    || point.frequence === "HEBDOMADAIRE"
    || point.frequence === "AUTRE"
    ? point.frequence
    : "QUOTIDIEN";

  return {
    id:point.id,
    entrepriseId:point.entrepriseId ?? entrepriseId,
    nom:point.nom ?? "Point de contrôle",
    description:point.description,
    zone:point.zone ?? point.emplacement ?? "",
    typeControle:point.typeControle ?? "TEMPERATURE",
    frequence,
    obligatoire:point.obligatoire ?? true,
    actif:point.actif ?? true,
    creePar:point.creePar ?? "MIGRATION",
    dateCreation:point.dateCreation ?? new Date().toISOString(),
    utilisateursAutorises:
      point.utilisateursAutorises ?? point.responsablesAssignes ?? [],
    temperatureMin:point.temperatureMin,
    temperatureMax:point.temperatureMax,
  };
}

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
  const { ajouterProgression } = useRewards();

  async function enregistrerProgression(
    action:Omit<ParametresAttributionPoints,"entrepriseId">
  ) {
    if (!entrepriseActive) {
      return;
    }

    try {
      await ajouterProgression({
        ...action,
        entrepriseId:entrepriseActive.id,
      });
    } catch (error) {
      console.error("Erreur progression impériale", error);
    }
  }

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
        pointsControle:(donneesChargees.pointsControle || [])
          .map((point) => normaliserPointControle(
            point as AncienPointControle,
            entrepriseActive.id
          ))
          .filter((point) => point.entrepriseId === entrepriseActive.id),
        controlesRealises:(donneesChargees.controlesRealises || [])
          .filter((controle) => controle.entrepriseId === entrepriseActive.id)
          .map((controle) => ({
            ...controle,
            valeur:controle.valeur ?? (controle as ControleRealise & { resultat?:string }).resultat,
            conforme:controle.conforme ?? false,
            statutValidation:controle.statutValidation
              ?? (controle.validation ? "VALIDE" : controle.conforme ? "CLOS" : "EN_ATTENTE"),
          })),
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
    if (releve.pointControleId) {
      const pointAutorise = donnees.pointsControle.some((point) =>
        point.id === releve.pointControleId
        && point.entrepriseId === entrepriseActive?.id
        && point.actif
        && (utilisateurActif?.role === "GERANT"
          || (utilisateurActif ? point.utilisateursAutorises.includes(utilisateurActif.id) : false))
      );
      if (!pointAutorise) {
        throw new Error("Point de contrôle inactif, externe ou non attribué");
      }
    }
    const releveId = Date.now();
    const controleRealiseId = `${releveId}-${Math.random().toString(16).slice(2)}`;
    const points = calculerPointsReleve(releve);
    const progression = calculerProgressionHaccp(donnees.scoreHaccp, releve.conforme, !releve.conforme && Boolean(releve.photo), points);

    await sauvegarder({
      ...donnees,
      releves:[...donnees.releves, {
        id:releveId,
        ...releve,
        effectuePar:traceUtilisateur,
        controleRealiseId:releve.pointControleId ? controleRealiseId : undefined,
      }],
      controlesRealises:releve.pointControleId && traceUtilisateur && entrepriseActive
        ? [
            ...donnees.controlesRealises,
            {
              id:controleRealiseId,
              pointControleId:releve.pointControleId,
              utilisateurId:traceUtilisateur.id,
              entrepriseId:entrepriseActive.id,
              date:releve.date,
              heure:releve.heure,
              valeur:releve.temperature,
              conforme:releve.conforme,
              photo:releve.photo,
              commentaire:releve.commentaireAnomalie,
              actionCorrective:releve.actionCorrective,
              statutValidation:releve.conforme ? "CLOS" : "EN_ATTENTE",
            },
          ]
        : donnees.controlesRealises,
      score:donnees.score + points + progression.pointsRecompense,
      scoreHaccp:progression.scoreHaccp,
    });

    if (traceUtilisateur) {
      await enregistrerProgression({
        utilisateurId:traceUtilisateur.id,
        typeAction:"RELEVE_TEMPERATURE",
        conformite:releve.conforme,
        validation:false,
      });
    }

    if (traceUtilisateur && releve.photo) {
      await enregistrerProgression({
        utilisateurId:traceUtilisateur.id,
        typeAction:"PREUVE_PHOTO",
        conformite:releve.conforme,
        validation:false,
      });
    }

    if (traceUtilisateur && !releve.conforme && releve.anomalieTraitee) {
      await enregistrerProgression({
        utilisateurId:traceUtilisateur.id,
        typeAction:"ANOMALIE_TRAITEE",
        conformite:true,
        validation:false,
      });
    }

  }


  async function ajouterTrace(trace:Omit<TraceabiliteProduit,"id">){

    await sauvegarder({
      ...donnees,
      traces:[...donnees.traces, { id:Date.now(), ...trace, effectuePar: creerTraceUtilisateur() }],
    });

  }


  async function ajouterAction(action:Omit<ActionCorrective,"id">){

    const traceUtilisateur = creerTraceUtilisateur();

    await sauvegarder({
      ...donnees,
      actions:[...donnees.actions, { id:Date.now(), ...action, effectuePar: traceUtilisateur }],
    });

  }


  async function ajouterPointControle(
    point:Omit<PointControleHaccp,"id" | "entrepriseId" | "creePar" | "dateCreation">
  ):Promise<boolean>{
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) {
      return false;
    }

    const nouveau:PointControleHaccp = {
      ...point,
      id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId:entrepriseActive.id,
      creePar:utilisateurActif.id,
      dateCreation:new Date().toISOString(),
      utilisateursAutorises:point.utilisateursAutorises ?? [],
    };
    await sauvegarder({
      ...donnees,
      pointsControle:[...donnees.pointsControle, nouveau],
    });
    return true;
  }


  async function modifierPointControle(
    id:string,
    point:Partial<Omit<PointControleHaccp,"id" | "entrepriseId" | "creePar" | "dateCreation">>
  ):Promise<boolean>{
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) {
      return false;
    }

    const existe = donnees.pointsControle.some(
      (controle) => controle.id === id && controle.entrepriseId === entrepriseActive.id
    );
    if (!existe) {
      return false;
    }

    const pointsControleModifies = donnees.pointsControle.map((controle) =>
      controle.id === id ? { ...controle, ...point } : controle
    );

    await sauvegarder({
      ...donnees,
      pointsControle:pointsControleModifies,
    });
    return true;
  }


  async function supprimerPointControle(id:string):Promise<boolean>{
    if (utilisateurActif?.role !== "GERANT" || !entrepriseActive) {
      return false;
    }

    const existe = donnees.pointsControle.some(
      (controle) => controle.id === id && controle.entrepriseId === entrepriseActive.id
    );
    if (!existe) {
      return false;
    }
    await sauvegarder({
      ...donnees,
      pointsControle:donnees.pointsControle.filter((controle) => controle.id !== id),
    });
    return true;
  }

  function obtenirPointsControleEntreprise():PointControleHaccp[] {
    return donnees.pointsControle.filter(
      (controle) => controle.entrepriseId === entrepriseActive?.id
    );
  }

  async function enregistrerControleRealise(
    controle:Omit<ControleRealise,"id" | "entrepriseId" | "utilisateurId">
  ):Promise<ControleRealise | null> {
    if (!utilisateurActif || !entrepriseActive) {
      return null;
    }

    const point = donnees.pointsControle.find(
      (element) =>
        element.id === controle.pointControleId
        && element.entrepriseId === entrepriseActive.id
        && element.actif
        && (utilisateurActif.role === "GERANT"
          || element.utilisateursAutorises.includes(utilisateurActif.id))
    );
    if (!point) {
      return null;
    }

    const nouveau:ControleRealise = {
      ...controle,
      id:`${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId:entrepriseActive.id,
      utilisateurId:utilisateurActif.id,
    };
    await sauvegarder({
      ...donnees,
      controlesRealises:[...donnees.controlesRealises, nouveau],
    });

    await enregistrerProgression({
      utilisateurId:utilisateurActif.id,
      typeAction:"CONTROLE_HACCP",
      conformite:controle.conforme,
      validation:Boolean(controle.validation),
    });
    if (controle.photo) {
      await enregistrerProgression({
        utilisateurId:utilisateurActif.id,
        typeAction:"PREUVE_PHOTO",
        conformite:controle.conforme,
        validation:false,
      });
    }
    return nouveau;
  }

  async function validerControleRealise(
    id:string,
    identite:IdentiteValidation
  ):Promise<boolean> {
    const controle = donnees.controlesRealises.find(
      (element) => element.id === id && element.entrepriseId === entrepriseActive?.id
    );
    if (!controle || controle.statutValidation !== "EN_ATTENTE") {
      return false;
    }
    const validation = await validerAction({
      actionType:"HACCP_CONTROLE_NON_CONFORME",
      actionId:id,
      ...identite,
    });
    if (!validation) return false;

    await sauvegarder({
      ...donnees,
      controlesRealises:donnees.controlesRealises.map((element) =>
        element.id === id
          ? { ...element, validation, statutValidation:"VALIDE" as const }
          : element
      ),
    });
    if (controle.actionCorrective) {
      await enregistrerProgression({
        utilisateurId:controle.utilisateurId,
        typeAction:"ACTION_CORRECTIVE_VALIDEE",
        conformite:true,
        validation:true,
      });
    }
    await enregistrerProgression({
      utilisateurId:validation.valideParUtilisateurId,
      typeAction:"VALIDATION_RESPONSABLE",
      conformite:true,
      validation:true,
    });
    return true;
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

    const releveValide = donnees.releves.find((releve) => releve.id === id);
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
      controlesRealises:donnees.controlesRealises.map((controle) =>
        controle.id === releveValide?.controleRealiseId
          ? { ...controle, validation }
          : controle
      ),
    });

    await enregistrerProgression({
      utilisateurId:validation.valideParUtilisateurId,
      typeAction:"VALIDATION_RESPONSABLE",
      conformite:releveValide?.conforme ?? false,
      validation:true,
    });

    if (releveValide?.conforme && releveValide.effectuePar) {
      await enregistrerProgression({
        utilisateurId:releveValide.effectuePar.id,
        typeAction:"RELEVE_CONFORME_VALIDE",
        conformite:true,
        validation:true,
      });
    }

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

    const actionValidee = donnees.actions.find((action) => action.id === id);
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

    if (actionValidee?.effectuePar) {
      await enregistrerProgression({
        utilisateurId:actionValidee.effectuePar.id,
        typeAction:"ACTION_CORRECTIVE_VALIDEE",
        conformite:true,
        validation:true,
      });
    }

    await enregistrerProgression({
      utilisateurId:validation.valideParUtilisateurId,
      typeAction:"VALIDATION_RESPONSABLE",
      conformite:true,
      validation:true,
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


  function obtenirMesControles(): PointControleHaccp[] {
    if (!utilisateurActif || !entrepriseActive) {
      return [];
    }

    if (utilisateurActif.role === "GERANT") {
      return donnees.pointsControle.filter(
        (controle) =>
          controle.entrepriseId === entrepriseActive.id && controle.actif
      );
    }

    return donnees.pointsControle.filter(
      (controle) =>
        controle.entrepriseId === entrepriseActive.id
        && controle.actif
        && controle.utilisateursAutorises.includes(utilisateurActif.id)
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
        obtenirPointsControleEntreprise,
        enregistrerControleRealise,
        validerControleRealise,
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
