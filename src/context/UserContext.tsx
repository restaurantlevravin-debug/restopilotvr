import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import { useEntreprise } from "@/context/EntrepriseContext";
import type {
  Permission,
  PermissionsUtilisateur,
  RoleUtilisateur,
  Utilisateur,
} from "@/types/entreprise";

export type {
  Permission,
  PermissionsUtilisateur,
  RoleUtilisateur,
  Utilisateur,
} from "@/types/entreprise";

export const PERMISSIONS_PAR_ROLE: Record<
  RoleUtilisateur,
  Readonly<PermissionsUtilisateur>
> = {
  GERANT: {
    administrationEntreprise: true,
    gestionUtilisateurs: true,
    configurationHaccp: true,
    gestionPlanning: true,
    validationJournee: true,
  },
  CHEF_CUISINE: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: true,
    gestionPlanning: true,
    validationJournee: true,
  },
  MAITRE_HOTEL: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: false,
    gestionPlanning: true,
    validationJournee: true,
  },
  SALARIE: {
    administrationEntreprise: false,
    gestionUtilisateurs: false,
    configurationHaccp: false,
    gestionPlanning: false,
    validationJournee: false,
  },
};

const AUCUNE_PERMISSION: Readonly<PermissionsUtilisateur> = {
  administrationEntreprise: false,
  gestionUtilisateurs: false,
  configurationHaccp: false,
  gestionPlanning: false,
  validationJournee: false,
};

const STOCKAGE_USERS_PREFIX = "RESTOPILOT_USERS_";

function obtenirCleStockageUtilisateurs(entrepriseId: string): string {
  return `${STOCKAGE_USERS_PREFIX}${entrepriseId}`;
}

export function hasPermission(
  utilisateur: Utilisateur | null | undefined,
  permission: Permission
): boolean {
  return utilisateur
    ? PERMISSIONS_PAR_ROLE[utilisateur.role][permission]
    : false;
}

type NouvelUtilisateur = Omit<Utilisateur, "id" | "entrepriseId">;
type ModificationUtilisateur = Partial<
  Omit<Utilisateur, "id" | "entrepriseId">
>;

type UserContextType = {
  utilisateurs: Utilisateur[];
  utilisateurActif?: Utilisateur;
  ajouterUtilisateur: (utilisateur: NouvelUtilisateur) => Promise<void>;
  modifierUtilisateur: (
    id: string,
    utilisateur: ModificationUtilisateur
  ) => Promise<void>;
  supprimerUtilisateur: (id: string) => Promise<void>;
  changerUtilisateurActif: (id: string) => Promise<void>;
  obtenirPermissionsUtilisateur: (
    utilisateur?: Utilisateur | null
  ) => PermissionsUtilisateur;
  verifierPermission: (permission: Permission) => boolean;
  verifierPin: (pin: string) => boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [utilisateurActif, setUtilisateurActif] = useState<Utilisateur>();

  useEffect(() => {
    void chargerUtilisateurs();
  }, [entrepriseActive?.id]);

  async function chargerUtilisateurs() {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      setUtilisateurs([]);
      setUtilisateurActif(undefined);
      return;
    }

    try {
      const data = await AsyncStorage.getItem(
        obtenirCleStockageUtilisateurs(entrepriseId)
      );
      const listeStockee = data ? JSON.parse(data) as Utilisateur[] : [];
      const liste = listeStockee
        .map((utilisateur) => ({
          ...utilisateur,
          entrepriseId: utilisateur.entrepriseId || entrepriseId,
        }))
        .filter((utilisateur) => utilisateur.entrepriseId === entrepriseId);

      if (data && listeStockee.some((utilisateur) => !utilisateur.entrepriseId)) {
        await AsyncStorage.setItem(
          obtenirCleStockageUtilisateurs(entrepriseId),
          JSON.stringify(liste)
        );
      }

      setUtilisateurs(liste);
      setUtilisateurActif(
        liste.find((utilisateur) => utilisateur.actif) ?? liste[0]
      );
    } catch (error) {
      console.error("Erreur chargement utilisateurs", error);
      setUtilisateurs([]);
      setUtilisateurActif(undefined);
    }
  }

  async function sauvegarder(liste: Utilisateur[]) {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return;
    }

    const listeEntreprise = liste.filter(
      (utilisateur) => utilisateur.entrepriseId === entrepriseId
    );

    setUtilisateurs(listeEntreprise);
    setUtilisateurActif(
      listeEntreprise.find((utilisateur) => utilisateur.actif)
        ?? listeEntreprise[0]
    );
    await AsyncStorage.setItem(
      obtenirCleStockageUtilisateurs(entrepriseId),
      JSON.stringify(listeEntreprise)
    );
  }

  async function ajouterUtilisateur(utilisateur: NouvelUtilisateur) {
    const entrepriseId = entrepriseActive?.id;

    if (!entrepriseId) {
      return;
    }

    const nouveau: Utilisateur = {
      ...utilisateur,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId,
    };

    await sauvegarder([...utilisateurs, nouveau]);
  }

  async function modifierUtilisateur(
    id: string,
    utilisateur: ModificationUtilisateur
  ) {
    await sauvegarder(
      utilisateurs.map((existant) =>
        existant.id === id ? { ...existant, ...utilisateur } : existant
      )
    );
  }

  async function supprimerUtilisateur(id: string) {
    await sauvegarder(
      utilisateurs.filter((utilisateur) => utilisateur.id !== id)
    );
  }

  async function changerUtilisateurActif(id: string) {
    await sauvegarder(
      utilisateurs.map((utilisateur) => ({
        ...utilisateur,
        actif: utilisateur.id === id,
      }))
    );
  }

  function obtenirPermissionsUtilisateur(
    utilisateur?: Utilisateur | null
  ): PermissionsUtilisateur {
    const source = utilisateur ?? utilisateurActif;
    return { ...(source ? PERMISSIONS_PAR_ROLE[source.role] : AUCUNE_PERMISSION) };
  }

  function verifierPermission(permission: Permission): boolean {
    return hasPermission(utilisateurActif, permission);
  }

  function verifierPin(pin: string): boolean {
    return Boolean(utilisateurActif?.pin && utilisateurActif.pin === pin);
  }

  return (
    <UserContext.Provider
      value={{
        utilisateurs,
        utilisateurActif,
        ajouterUtilisateur,
        modifierUtilisateur,
        supprimerUtilisateur,
        changerUtilisateurActif,
        obtenirPermissionsUtilisateur,
        verifierPermission,
        verifierPin,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser doit être utilisé dans UserProvider");
  }

  return context;
}
