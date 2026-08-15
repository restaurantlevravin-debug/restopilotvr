import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { rewards, type Reward } from "@/constants/rewards";
import { obtenirCleStockageProfilsImperiaux } from "@/constants/storage";
import { useEntreprise } from "@/context/EntrepriseContext";
import { useUser } from "@/context/UserContext";
import { attribuerPointsAction } from "@/services/progressionService";
import type {
  ActionProgression,
  GradeImperial,
  ParametresAttributionPoints,
  ProfilImperialUtilisateur,
} from "@/types/reward";

type RewardContextType = {
  profilImperial?: ProfilImperialUtilisateur;
  chargement: boolean;
  recompenseRecente?: Reward;
  obtenirProfilImperial: (utilisateurId?: string) => ProfilImperialUtilisateur | undefined;
  ajouterProgression: (parametres: ParametresAttributionPoints) => Promise<ActionProgression | null>;
  obtenirHistoriqueProgression: (utilisateurId?: string) => ActionProgression[];
  calculerGrade: (profil?: ProfilImperialUtilisateur) => GradeImperial;
  debloquerRecompense: (recompenseId: string, utilisateurId?: string) => Promise<boolean>;
  changerAvatarUtilisateur: (recompenseId: string, utilisateurId?: string) => Promise<boolean>;
  fermerNotificationRecompense: () => void;
};

const RewardContext = createContext<RewardContextType | null>(null);

function creerProfil(utilisateurId: string, entrepriseId: string): ProfilImperialUtilisateur {
  return {
    utilisateurId,
    entrepriseId,
    avatarActuel: "padawan",
    niveau: 1,
    pointsHaccp: 0,
    grade: "PADAWAN HACCP",
    recompensesDebloquees: [],
    historiqueRecompenses: [],
    historiqueProgression: [],
    nombreActionsEvaluees: 0,
    nombreActionsConformes: 0,
    oublisCritiques: 0,
  };
}

function calculerTauxConformite(profil: ProfilImperialUtilisateur): number {
  return profil.nombreActionsEvaluees === 0
    ? 0
    : profil.nombreActionsConformes / profil.nombreActionsEvaluees;
}

function calculerGradeProfil(profil?: ProfilImperialUtilisateur): GradeImperial {
  if (!profil) {
    return "PADAWAN HACCP";
  }

  const tauxConformite = calculerTauxConformite(profil);

  if (
    profil.nombreActionsConformes >= 500
    && tauxConformite >= 0.98
    && profil.oublisCritiques === 0
  ) {
    return "EMPEREUR IMPÉRIAL";
  }

  if (profil.nombreActionsConformes >= 100 && tauxConformite >= 0.95) {
    return "MONSTRE HACCP";
  }

  return "PADAWAN HACCP";
}

function normaliserProfil(profil: ProfilImperialUtilisateur): ProfilImperialUtilisateur {
  return {
    ...creerProfil(profil.utilisateurId, profil.entrepriseId),
    ...profil,
    recompensesDebloquees: profil.recompensesDebloquees ?? [],
    historiqueRecompenses: profil.historiqueRecompenses ?? [],
    historiqueProgression: profil.historiqueProgression ?? [],
    nombreActionsEvaluees: profil.nombreActionsEvaluees ?? 0,
    nombreActionsConformes: profil.nombreActionsConformes ?? 0,
    oublisCritiques: profil.oublisCritiques ?? 0,
  };
}

function obtenirNiveau(grade: GradeImperial): number {
  if (grade === "EMPEREUR IMPÉRIAL") return 3;
  if (grade === "MONSTRE HACCP") return 2;
  return 1;
}

export function RewardProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const { utilisateurActif } = useUser();
  const [profils, setProfils] = useState<ProfilImperialUtilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recompenseRecente, setRecompenseRecente] = useState<Reward>();

  useEffect(() => {
    void chargerProfils();
  }, [entrepriseActive?.id]);

  async function chargerProfils() {
    const entrepriseId = entrepriseActive?.id;
    setChargement(true);

    if (!entrepriseId) {
      setProfils([]);
      setChargement(false);
      return;
    }

    try {
      const stockage = await AsyncStorage.getItem(obtenirCleStockageProfilsImperiaux(entrepriseId));
      const liste = stockage
        ? (JSON.parse(stockage) as ProfilImperialUtilisateur[])
            .filter((profil) => profil.entrepriseId === entrepriseId)
            .map(normaliserProfil)
        : [];
      setProfils(liste);
    } catch (error) {
      console.error("Erreur chargement profils impériaux", error);
      setProfils([]);
    } finally {
      setChargement(false);
    }
  }

  async function lireProfilsEntreprise(entrepriseId: string): Promise<ProfilImperialUtilisateur[]> {
    const stockage = await AsyncStorage.getItem(obtenirCleStockageProfilsImperiaux(entrepriseId));
    return stockage
      ? (JSON.parse(stockage) as ProfilImperialUtilisateur[])
          .filter((profil) => profil.entrepriseId === entrepriseId)
          .map(normaliserProfil)
      : [];
  }

  async function sauvegarderProfils(entrepriseId: string, liste: ProfilImperialUtilisateur[]) {
    setProfils(liste);
    await AsyncStorage.setItem(
      obtenirCleStockageProfilsImperiaux(entrepriseId),
      JSON.stringify(liste)
    );
  }

  function obtenirProfilImperial(utilisateurId?: string) {
    const id = utilisateurId ?? utilisateurActif?.id;
    const entrepriseId = entrepriseActive?.id;

    if (!id || !entrepriseId) return undefined;

    return profils.find(
      (profil) => profil.utilisateurId === id && profil.entrepriseId === entrepriseId
    ) ?? creerProfil(id, entrepriseId);
  }

  function obtenirHistoriqueProgression(utilisateurId?: string): ActionProgression[] {
    return obtenirProfilImperial(utilisateurId)?.historiqueProgression ?? [];
  }

  async function ajouterProgression(
    parametres: ParametresAttributionPoints
  ): Promise<ActionProgression | null> {
    if (
      !parametres.utilisateurId
      || !parametres.entrepriseId
      || parametres.entrepriseId !== entrepriseActive?.id
    ) {
      return null;
    }

    const progression = attribuerPointsAction(parametres);
    const liste = await lireProfilsEntreprise(parametres.entrepriseId);
    const existant = liste.find(
      (profil) => profil.utilisateurId === parametres.utilisateurId
    ) ?? creerProfil(parametres.utilisateurId, parametres.entrepriseId);
    const estReleve = parametres.typeAction === "RELEVE_TEMPERATURE"
      || parametres.typeAction === "CONTROLE_HACCP";
    const profilAvecAction: ProfilImperialUtilisateur = {
      ...existant,
      pointsHaccp: Math.max(0, existant.pointsHaccp + progression.points),
      historiqueProgression: [...existant.historiqueProgression, progression],
      nombreActionsEvaluees: existant.nombreActionsEvaluees + (estReleve ? 1 : 0),
      nombreActionsConformes:
        existant.nombreActionsConformes + (estReleve && parametres.conformite ? 1 : 0),
      oublisCritiques:
        existant.oublisCritiques + (parametres.typeAction === "OUBLI_CRITIQUE" ? 1 : 0),
    };
    const grade = calculerGradeProfil(profilAvecAction);
    const nouveauxIds: string[] = [];

    if (
      parametres.typeAction === "RELEVE_CONFORME_VALIDE"
      && parametres.conformite
      && parametres.validation
      && !existant.recompensesDebloquees.includes("padawan")
    ) nouveauxIds.push("padawan");

    const padawanDebloque = existant.recompensesDebloquees.includes("padawan")
      || nouveauxIds.includes("padawan");

    if (
      padawanDebloque
      && grade === "MONSTRE HACCP"
      && !existant.recompensesDebloquees.includes("monstre")
    ) {
      nouveauxIds.push("monstre");
    }

    const monstreDebloque = existant.recompensesDebloquees.includes("monstre")
      || nouveauxIds.includes("monstre");

    if (
      monstreDebloque
      && grade === "EMPEREUR IMPÉRIAL"
      && !existant.recompensesDebloquees.includes("empereur")
    ) {
      nouveauxIds.push("empereur");
    }

    const maintenant = new Date().toISOString();
    const profil: ProfilImperialUtilisateur = {
      ...profilAvecAction,
      grade,
      niveau: obtenirNiveau(grade),
      recompensesDebloquees: [...existant.recompensesDebloquees, ...nouveauxIds],
      historiqueRecompenses: [
        ...existant.historiqueRecompenses,
        ...nouveauxIds.map((recompenseId) => ({
          id: `${maintenant}-${recompenseId}`,
          recompenseId,
          dateDeblocage: maintenant,
        })),
      ],
    };

    await sauvegarderProfils(parametres.entrepriseId, [
      ...liste.filter((element) => element.utilisateurId !== parametres.utilisateurId),
      profil,
    ]);

    const derniere = nouveauxIds.at(-1);
    if (derniere) {
      setRecompenseRecente(rewards.find((recompense) => recompense.id === derniere));
    }

    return progression;
  }

  async function debloquerRecompense(
    recompenseId: string,
    utilisateurId?: string
  ): Promise<boolean> {
    const entrepriseId = entrepriseActive?.id;
    const id = utilisateurId ?? utilisateurActif?.id;
    const recompense = rewards.find((element) => element.id === recompenseId);

    if (!entrepriseId || !id || !recompense) return false;

    const liste = await lireProfilsEntreprise(entrepriseId);
    const existant = liste.find((profil) => profil.utilisateurId === id)
      ?? creerProfil(id, entrepriseId);

    if (existant.recompensesDebloquees.includes(recompenseId)) return true;

    const maintenant = new Date().toISOString();
    const profil: ProfilImperialUtilisateur = {
      ...existant,
      recompensesDebloquees: [...existant.recompensesDebloquees, recompenseId],
      historiqueRecompenses: [
        ...existant.historiqueRecompenses,
        { id: `${maintenant}-${recompenseId}`, recompenseId, dateDeblocage: maintenant },
      ],
    };

    await sauvegarderProfils(entrepriseId, [
      ...liste.filter((element) => element.utilisateurId !== id),
      profil,
    ]);
    setRecompenseRecente(recompense);
    return true;
  }

  async function changerAvatarUtilisateur(
    recompenseId: string,
    utilisateurId?: string
  ): Promise<boolean> {
    const entrepriseId = entrepriseActive?.id;
    const id = utilisateurId ?? utilisateurActif?.id;

    if (!entrepriseId || !id) return false;

    const liste = await lireProfilsEntreprise(entrepriseId);
    const profil = liste.find((element) => element.utilisateurId === id);

    if (!profil?.recompensesDebloquees.includes(recompenseId)) return false;

    await sauvegarderProfils(
      entrepriseId,
      liste.map((element) =>
        element.utilisateurId === id ? { ...element, avatarActuel: recompenseId } : element
      )
    );
    return true;
  }

  const profilImperial = obtenirProfilImperial();

  return (
    <RewardContext.Provider
      value={{
        profilImperial,
        chargement,
        recompenseRecente,
        obtenirProfilImperial,
        ajouterProgression,
        obtenirHistoriqueProgression,
        calculerGrade: (profil) => calculerGradeProfil(profil ?? profilImperial),
        debloquerRecompense,
        changerAvatarUtilisateur,
        fermerNotificationRecompense: () => setRecompenseRecente(undefined),
      }}
    >
      {children}
    </RewardContext.Provider>
  );
}

export function useRewards() {
  const context = useContext(RewardContext);
  if (!context) throw new Error("useRewards doit être utilisé dans RewardProvider");
  return context;
}
