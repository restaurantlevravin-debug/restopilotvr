import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useEntreprise } from "@/context/EntrepriseContext";

export type RoleUtilisateur =
  | "GERANT"
  | "CHEF_CUISINE"
  | "MAITRE_HOTEL"
  | "SALARIE";

export type PermissionUtilisateur =
  | "administrationEntreprise"
  | "gererEntreprise"
  | "gererUtilisateurs"
  | "modifierConfigurationHaccp"
  | "releverTemperature"
  | "gererDlc"
  | "gererTracabilite"
  | "traiterAnomalies"
  | "validerHaccp"
  | "signerHaccp";

export type PermissionsUtilisateur = {
  administrationEntreprise: boolean;
  gererEntreprise: boolean;
  gererUtilisateurs: boolean;
  modifierConfigurationHaccp: boolean;
  releverTemperature: boolean;
  gererDlc: boolean;
  gererTracabilite: boolean;
  traiterAnomalies: boolean;
  validerHaccp: boolean;
  signerHaccp: boolean;
};

export type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: RoleUtilisateur;
  entrepriseId: string;
  actif: boolean;
  pin?: string;
};

export const PERMISSIONS_PAR_ROLE: Record<RoleUtilisateur, PermissionsUtilisateur> = {
  GERANT: {
    gererEntreprise: true,
    gererUtilisateurs: true,
    modifierConfigurationHaccp: true,
    releverTemperature: true,
    gererDlc: true,
    gererTracabilite: true,
    traiterAnomalies: true,
    validerHaccp: true,
    signerHaccp: true,
  },
  CHEF_CUISINE: {
    gererEntreprise: false,
    gererUtilisateurs: false,
    modifierConfigurationHaccp: false,
    releverTemperature: true,
    gererDlc: true,
    gererTracabilite: true,
    traiterAnomalies: true,
    validerHaccp: true,
    signerHaccp: true,
  },
  MAITRE_HOTEL: {
    gererEntreprise: false,
    gererUtilisateurs: false,
    modifierConfigurationHaccp: false,
    releverTemperature: true,
    gererDlc: true,
    gererTracabilite: true,
    traiterAnomalies: true,
    validerHaccp: true,
    signerHaccp: true,
  },
  SALARIE: {
    gererEntreprise: false,
    gererUtilisateurs: false,
    modifierConfigurationHaccp: false,
    releverTemperature: true,
    gererDlc: true,
    gererTracabilite: true,
    traiterAnomalies: true,
    validerHaccp: false,
    signerHaccp: false,
  },
};

const STOCKAGE_USERS_PREFIX = "RESTOPILOT_USERS_";

function obtenirCleStockageUtilisateurs(entrepriseId: string): string {
  return `${STOCKAGE_USERS_PREFIX}${entrepriseId}`;
}

function permissionsParDefaut(): PermissionsUtilisateur {
  return {
    gererEntreprise: false,
    gererUtilisateurs: false,
    modifierConfigurationHaccp: false,
    releverTemperature: false,
    gererDlc: false,
    gererTracabilite: false,
    traiterAnomalies: false,
    validerHaccp: false,
    signerHaccp: false,
  };
}

export function hasPermission(
  utilisateur: Utilisateur | null | undefined,
  permission: PermissionUtilisateur
): boolean {
  if (!utilisateur) {
    return false;
  }

  return PERMISSIONS_PAR_ROLE[utilisateur.role][permission];
}

type UserContextType = {
  utilisateurs: Utilisateur[];
  utilisateurActif?: Utilisateur;
  ajouterUtilisateur: (utilisateur: Omit<Utilisateur, "id">) => Promise<void>;
  modifierUtilisateur: (
    id: string,
    utilisateur: Partial<Omit<Utilisateur, "id">>
  ) => Promise<void>;
  supprimerUtilisateur: (id: string) => Promise<void>;
  changerUtilisateurActif: (id: string) => Promise<void>;
  obtenirPermissionsUtilisateur: (
    utilisateur?: Utilisateur | null
  ) => PermissionsUtilisateur;
  verifierPermission: (permission: PermissionUtilisateur) => boolean;
  verifierPin: (pin: string) => boolean;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { entrepriseActive } = useEntreprise();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [utilisateurActif, setUtilisateurActif] = useState<Utilisateur>();

  useEffect(() => {
    chargerUtilisateurs();
  }, [entrepriseActive?.id]);

  async function chargerUtilisateurs() {
    if (!entrepriseActive?.id) {
      setUtilisateurs([]);
      setUtilisateurActif(undefined);
      return;
    }

    const cle = obtenirCleStockageUtilisateurs(entrepriseActive.id);
    const data = await AsyncStorage.getItem(cle);

    if (!data) {
      setUtilisateurs([]);
      setUtilisateurActif(undefined);
      return;
    }

    try {
      const liste = JSON.parse(data) as Utilisateur[];
      setUtilisateurs(liste);

      const selectionActuelle =
        liste.find((u) => u.actif) ?? liste[0] ?? undefined;
      setUtilisateurActif(selectionActuelle);
    } catch (error) {
      console.log("Erreur chargement utilisateurs", error);
      setUtilisateurs([]);
      setUtilisateurActif(undefined);
    }
  }

  async function sauvegarder(liste: Utilisateur[]) {
    if (!entrepriseActive?.id) {
      return;
    }

    const cle = obtenirCleStockageUtilisateurs(entrepriseActive.id);
    setUtilisateurs(liste);
    await AsyncStorage.setItem(cle, JSON.stringify(liste));

    const utilisateurSelectionne =
      liste.find((u) => u.actif) ?? liste[0] ?? undefined;
    setUtilisateurActif(utilisateurSelectionne);
  }

  async function ajouterUtilisateur(utilisateur: Omit<Utilisateur, "id">) {
    if (!entrepriseActive?.id) {
      return;
    }

    const nouveau: Utilisateur = {
      ...utilisateur,
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      entrepriseId: entrepriseActive.id,
    };

    await sauvegarder([...utilisateurs, nouveau]);
  }

  async function modifierUtilisateur(
    id: string,
    utilisateur: Partial<Omit<Utilisateur, "id">>
  ) {
    if (!entrepriseActive?.id) {
      return;
    }

    const liste = utilisateurs.map((u) => {
      if (u.id !== id) {
        return u;
      }

      return {
        ...u,
        ...utilisateur,
        entrepriseId: entrepriseActive.id,
      };
    });

    await sauvegarder(liste);
  }

  async function supprimerUtilisateur(id: string) {
    const liste = utilisateurs.filter((u) => u.id !== id);
    await sauvegarder(liste);
  }

  async function changerUtilisateurActif(id: string) {
    const liste = utilisateurs.map((u) => ({
      ...u,
      actif: u.id === id,
    }));

    await sauvegarder(liste);
  }

  function obtenirPermissionsUtilisateur(
    utilisateur?: Utilisateur | null
  ): PermissionsUtilisateur {
    const source = utilisateur ?? utilisateurActif;

    if (!source) {
      return permissionsParDefaut();
    }

    return {
      ...PERMISSIONS_PAR_ROLE[source.role],
    };
  }

  function verifierPermission(permission: PermissionUtilisateur): boolean {
    return hasPermission(utilisateurActif, permission);
  }

  function verifierPin(pin: string): boolean {
    if (!utilisateurActif || !utilisateurActif.pin) {
      return false;
    }

    return utilisateurActif.pin === pin;
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
