import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import ConfirmationPointage from "@/components/pad-central/ConfirmationPointage";
import { ServiceWelcomePopup } from "@/components/pad-central/ServiceWelcomePopup";
import PadAccueil from "@/components/pad-central/PadAccueil";
import PadLayout from "@/components/pad-central/PadLayout";
import SelectionUtilisateur from "@/components/pad-central/SelectionUtilisateur";
import ValidationPin from "@/components/pad-central/ValidationPin";
import { rewards } from "@/constants/rewards";
import { useEntreprise } from "@/context/EntrepriseContext";
import { PointagePadProvider, usePointagePad } from "@/context/PointagePadContext";
import { useRewards } from "@/context/RewardContext";
import type { Utilisateur } from "@/types/entreprise";
import type { Pointage, TypePointage } from "@/types/pointage";

type EtapePad = "ACCUEIL" | "SELECTION" | "PIN";

export default function PadCentralScreen() {
  return <PointagePadProvider mode="PAD_CENTRAL"><TerminalPad /></PointagePadProvider>;
}

function TerminalPad() {
  const { entrepriseActive } = useEntreprise();
  const { obtenirProfilImperial } = useRewards();
  const { configurationPad, creerConfigurationPad, pointerArrivee, pointerDepartService, ambiancePointage, fermerAmbiancePointage } = usePointagePad();
  const [etape, setEtape] = useState<EtapePad>("ACCUEIL");
  const [type, setType] = useState<Extract<TypePointage, "ARRIVEE" | "DEPART_SERVICE">>("ARRIVEE");
  const [utilisateur, setUtilisateur] = useState<Utilisateur>();
  const [pointage, setPointage] = useState<Pointage>();
  const [erreurPin, setErreurPin] = useState(false);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (entrepriseActive && !configurationPad) void creerConfigurationPad(`PAD ${entrepriseActive.nom}`);
  }, [configurationPad, entrepriseActive]);

  const reinitialiser = useCallback(() => {
    setPointage(undefined); setUtilisateur(undefined); setEtape("ACCUEIL"); setErreurPin(false); setEnCours(false); fermerAmbiancePointage();
  }, [fermerAmbiancePointage]);

  function choisirAction(action: typeof type) { setType(action); setEtape("SELECTION"); setErreurPin(false); }
  function choisirUtilisateur(selection: Utilisateur) { setUtilisateur(selection); setEtape("PIN"); setErreurPin(false); }

  async function validerPin(pin: string) {
    if (!utilisateur || pin.length < 4) { setErreurPin(true); return; }
    setEnCours(true);
    const resultat = type === "ARRIVEE" ? await pointerArrivee(utilisateur.id, pin) : await pointerDepartService(utilisateur.id, pin);
    setEnCours(false);
    if (!resultat) { setErreurPin(true); return; }
    setErreurPin(false); setPointage(resultat);
  }

  if (!configurationPad || !entrepriseActive) return <PadLayout><Text style={{ color: "#f1d17a", fontSize: 24, fontWeight: "900" }}>Configuration du PAD…</Text></PadLayout>;
  const profil = pointage ? obtenirProfilImperial(pointage.utilisateurId) : undefined;
  const avatar = rewards.find((recompense) => recompense.id === profil?.avatarActuel)?.image;
  const confirmation = pointage && utilisateur
    ? ambiancePointage
      ? <ServiceWelcomePopup ambiance={ambiancePointage} avatar={avatar} onFermer={reinitialiser} />
      : <ConfirmationPointage pointage={pointage} utilisateur={utilisateur} ambiance={null} avatar={avatar} onFermer={reinitialiser} />
    : undefined;

  return <PadLayout overlay={confirmation}>
    {etape === "ACCUEIL" ? <PadAccueil entreprise={entrepriseActive.nom} onPrendreService={() => choisirAction("ARRIVEE")} onTerminerService={() => choisirAction("DEPART_SERVICE")} /> : null}
    {etape === "SELECTION" ? <SelectionUtilisateur selectionId={utilisateur?.id} onSelectionner={choisirUtilisateur} onRetour={reinitialiser} /> : null}
    {etape === "PIN" && utilisateur ? <ValidationPin utilisateur={utilisateur} erreur={erreurPin ? "PIN incorrect" : undefined} enCours={enCours} onValider={(pin) => void validerPin(pin)} onRetour={() => { setEtape("SELECTION"); setErreurPin(false); }} /> : null}
  </PadLayout>;
}
