import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

import { obtenirCleStockageCloturesJournee } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { useValidation } from "@/context/ValidationContext";
import type { Entreprise, ServiceOuverture } from "@/types/entreprise";
import type {
  ClotureJournee,
  ControlesCloture,
  ResumeClotureJournee,
  ServiceCloture,
} from "@/types/cloture";

type ClotureJourneeContextType = {
  clotures: ClotureJournee[];
  clotureExploitation?: ClotureJournee;
  chargement: boolean;
  terminerExploitation: (resume: ResumeClotureJournee) => Promise<boolean>;
  cloturerJournee: (resume: ResumeClotureJournee) => Promise<boolean>;
  rouvrirExceptionnellement: (clotureId: string) => Promise<boolean>;
};

const ClotureJourneeContext = createContext<ClotureJourneeContextType | null>(null);

const CONTROLES_INITIAUX: ControlesCloture = {
  haccp: false,
  planning: false,
  pointage: false,
  anomalies: false,
  actionsObligatoiresControlees: false,
};

const JOURS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formaterDateIso(date: Date): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  const jour = String(date.getDate()).padStart(2, "0");
  return `${annee}-${mois}-${jour}`;
}

function formaterHeure(date: Date): string {
  return [date.getHours(), date.getMinutes()]
    .map((valeur) => String(valeur).padStart(2, "0"))
    .join(":");
}

function obtenirServicesEntreprise(
  entreprise: Entreprise,
  date: Date
): ServiceOuverture[] {
  const dateIso = formaterDateIso(date);
  const exception = entreprise.exceptionsExploitation.find(
    (element) => element.date === dateIso
  );

  if (exception) {
    return exception.ouvert ? exception.services : [];
  }

  const nomJour = JOURS_FR[date.getDay()];
  const jour = entreprise.joursOuverture.find(
    (element) => normaliserTexte(element.jour) === nomJour
  );
  return jour?.ouvert ? jour.services : [];
}

export function entrepriseOuverteLe(entreprise: Entreprise, date: Date): boolean {
  return obtenirServicesEntreprise(entreprise, date).length > 0;
}

function creerServicesCloture(services: ServiceOuverture[]): ServiceCloture[] {
  return services.map((service, index) => ({
    nom: services.length === 1 ? "Service" : index === 0 ? "Midi" : index === 1 ? "Soir" : `Service ${index + 1}`,
    heureDebut: service.heureDebut,
    heureFin: service.heureFin,
    controle: false,
  }));
}

function obligationsControlees(resume: ResumeClotureJournee): boolean {
  return resume.services.every((service) => service.controle)
    && Object.values(resume.controles).every(Boolean);
}

export function ClotureJourneeProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif } = useUser();
  const { validerAction } = useValidation();
  const [clotures, setClotures] = useState<ClotureJournee[]>([]);
  const [chargement, setChargement] = useState(true);

  const clotureExploitation = useMemo(
    () => clotures.find((cloture) => cloture.statut !== "VALIDEE")
      ?? clotures.at(-1),
    [clotures]
  );

  useEffect(() => {
    void chargerEtInitialiser();
  }, [entrepriseActive?.id]);

  useEffect(() => {
    if (
      utilisateurActif?.role === "GERANT"
      && (
        clotureExploitation?.statut === "OUVERTE"
        || clotureExploitation?.statut === "ROUVERTE_EXCEPTIONNELLEMENT"
      )
      && !clotureExploitation.notification22hId
    ) {
      void programmerRappel22h(clotureExploitation);
    }
  }, [utilisateurActif?.id, clotureExploitation?.id, clotureExploitation?.notification22hId]);

  async function chargerEtInitialiser() {
    const entreprise = entrepriseActive;
    setChargement(true);

    if (!entreprise) {
      setClotures([]);
      setChargement(false);
      return;
    }

    try {
      const cle = obtenirCleStockageCloturesJournee(entreprise.id);
      const stockage = await AsyncStorage.getItem(cle);
      const liste = stockage
        ? (JSON.parse(stockage) as ClotureJournee[]).filter(
            (cloture) => cloture.entrepriseId === entreprise.id
          )
        : [];
      const nonTerminee = liste.some((cloture) => cloture.statut !== "VALIDEE");
      const maintenant = new Date();

      if (!nonTerminee && entrepriseOuverteLe(entreprise, maintenant)) {
        const nouvelle: ClotureJournee = {
          id: `${entreprise.id}-${formaterDateIso(maintenant)}`,
          entrepriseId: entreprise.id,
          dateDebutExploitation: formaterDateIso(maintenant),
          statut: "OUVERTE",
          services: creerServicesCloture(obtenirServicesEntreprise(entreprise, maintenant)),
          controles: CONTROLES_INITIAUX,
        };
        const nouvelleListe = [...liste, nouvelle];
        setClotures(nouvelleListe);
        await AsyncStorage.setItem(cle, JSON.stringify(nouvelleListe));
      } else {
        setClotures(liste);
      }
    } catch (error) {
      console.error("Erreur chargement clôtures de journée", error);
      setClotures([]);
    } finally {
      setChargement(false);
    }
  }

  async function sauvegarder(liste: ClotureJournee[]) {
    if (!entrepriseActive) return;
    setClotures(liste);
    await AsyncStorage.setItem(
      obtenirCleStockageCloturesJournee(entrepriseActive.id),
      JSON.stringify(liste)
    );
  }

  async function programmerRappel22h(cloture: ClotureJournee) {
    if (
      Platform.OS === "web"
      || !entrepriseActive
      || utilisateurActif?.role !== "GERANT"
      || cloture.entrepriseId !== entrepriseActive.id
      || cloture.dateDebutExploitation !== formaterDateIso(new Date())
      || !entrepriseOuverteLe(entrepriseActive, new Date())
    ) return;

    const rappel = new Date();
    rappel.setHours(22, 0, 0, 0);
    if (rappel.getTime() <= Date.now()) return;

    try {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("cloture-exploitation", {
          name: "Clôture d’exploitation",
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      let permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Notifications.requestPermissionsAsync();
      }
      if (permission.status !== "granted") return;

      const notification22hId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "👑 L'Empire veille sur votre journée",
          body: "Votre journée d'exploitation devra être validée avant clôture définitive.",
          data: { entrepriseId: entrepriseActive.id, clotureId: cloture.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: rappel,
          channelId: Platform.OS === "android" ? "cloture-exploitation" : undefined,
        },
      });
      await sauvegarder(
        clotures.map((element) =>
          element.id === cloture.id ? { ...element, notification22hId } : element
        )
      );
    } catch (error) {
      console.error("Erreur programmation rappel clôture 22h", error);
    }
  }

  async function terminerExploitation(resume: ResumeClotureJournee): Promise<boolean> {
    if (
      utilisateurActif?.role !== "GERANT"
      || !clotureExploitation
      || clotureExploitation.statut === "VALIDEE"
    ) return false;

    const maintenant = new Date();
    await sauvegarder(
      clotures.map((cloture) =>
        cloture.id === clotureExploitation.id
          ? {
              ...cloture,
              dateFinExploitation: formaterDateIso(maintenant),
              heureFinReelle: formaterHeure(maintenant),
              statut: "EN_ATTENTE_VALIDATION",
              services: resume.services.map((service) => ({ ...service, controle: true })),
              controles: resume.controles,
            }
          : cloture
      )
    );
    return true;
  }

  async function cloturerJournee(resume: ResumeClotureJournee): Promise<boolean> {
    if (
      utilisateurActif?.role !== "GERANT"
      || !clotureExploitation
      || clotureExploitation.statut !== "EN_ATTENTE_VALIDATION"
      || !obligationsControlees(resume)
    ) return false;

    const validation = await validerAction({
      actionType: "CLOTURE_JOURNEE_EXPLOITATION",
      actionId: clotureExploitation.id,
      permissionRequise: "validationJournee",
      methodeValidation: "CLIC",
      utilisateurId: utilisateurActif.id,
    });
    if (!validation) return false;

    const maintenant = new Date();
    const cloturesValidees: ClotureJournee[] = clotures.map((cloture) =>
        cloture.id === clotureExploitation.id
          ? {
              ...cloture,
              dateFinExploitation: cloture.dateFinExploitation ?? formaterDateIso(maintenant),
              heureFinReelle: cloture.heureFinReelle ?? formaterHeure(maintenant),
              valideeLe: maintenant.toISOString(),
              statut: "VALIDEE",
              services: resume.services,
              controles: resume.controles,
              valideeParUtilisateurId: utilisateurActif.id,
              validationId: validation.id,
            }
          : cloture
    );

    if (clotureExploitation.notification22hId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(
          clotureExploitation.notification22hId
        );
      } catch {
        // Une notification déjà délivrée ne bloque jamais la clôture.
      }
    }

    const dateCourante = formaterDateIso(maintenant);
    const doitOuvrirExploitationSuivante = entrepriseActive
      && clotureExploitation.dateDebutExploitation !== dateCourante
      && entrepriseOuverteLe(entrepriseActive, maintenant);
    const cloturesFinales = doitOuvrirExploitationSuivante
      ? [
          ...cloturesValidees,
          {
            id: `${entrepriseActive.id}-${dateCourante}`,
            entrepriseId: entrepriseActive.id,
            dateDebutExploitation: dateCourante,
            statut: "OUVERTE" as const,
            services: creerServicesCloture(
              obtenirServicesEntreprise(entrepriseActive, maintenant)
            ),
            controles: CONTROLES_INITIAUX,
          },
        ]
      : cloturesValidees;

    await sauvegarder(cloturesFinales);
    return true;
  }

  async function rouvrirExceptionnellement(clotureId: string): Promise<boolean> {
    if (utilisateurActif?.role !== "GERANT") return false;
    const cible = clotures.find((cloture) => cloture.id === clotureId);
    if (!cible || cible.statut !== "VALIDEE") return false;

    await sauvegarder(
      clotures.map((cloture) =>
        cloture.id === clotureId
          ? {
              ...cloture,
              statut: "ROUVERTE_EXCEPTIONNELLEMENT",
              dateFinExploitation: undefined,
              heureFinReelle: undefined,
              valideeLe: undefined,
              notification22hId: undefined,
            }
          : cloture
      )
    );
    return true;
  }

  return (
    <ClotureJourneeContext.Provider
      value={{
        clotures,
        clotureExploitation,
        chargement,
        terminerExploitation,
        cloturerJournee,
        rouvrirExceptionnellement,
      }}
    >
      {children}
    </ClotureJourneeContext.Provider>
  );
}

export function useClotureJournee() {
  const context = useContext(ClotureJourneeContext);
  if (!context) {
    throw new Error("useClotureJournee doit être utilisé dans ClotureJourneeProvider");
  }
  return context;
}
