import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";

import ConfirmationPointage from "@/components/pad-central/ConfirmationPointage";
import PadAccueil from "@/components/pad-central/PadAccueil";
import PadLayout from "@/components/pad-central/PadLayout";
import SelectionUtilisateur from "@/components/pad-central/SelectionUtilisateur";
import ValidationPin from "@/components/pad-central/ValidationPin";
import { rewards } from "@/constants/rewards";
import { useEntreprise } from "@/context/EntrepriseContext";
import { usePlanning } from "@/context/PlanningContext";
import { PointagePadProvider, usePointagePad } from "@/context/PointagePadContext";
import { useRewards } from "@/context/RewardContext";
import type { Utilisateur } from "@/types/entreprise";
import type { Pointage, TypePointage } from "@/types/pointage";
import { construirePresenceJournee } from "@/services/tempsTravailService";

type EtapePad = "ACCUEIL" | "SELECTION" | "PIN";

export default function PadCentralScreen() {
  return <PointagePadProvider mode="PAD_CENTRAL"><TerminalPad /></PointagePadProvider>;
}

function TerminalPad() {
  const { entrepriseActive } = useEntreprise();
  const { obtenirProfilImperial } = useRewards();
  const { obtenirPlanningUtilisateur } = usePlanning();
  const { configurationPad, creerConfigurationPad, pointerArrivee, pointerDepartService, obtenirPointagesJour, ambiancePointage, fermerAmbiancePointage } = usePointagePad();
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
  const jourPlanning = pointage
    ? obtenirPlanningUtilisateur(pointage.utilisateurId, Number(pointage.date.slice(5, 7)), Number(pointage.date.slice(0, 4)))
      ?.ligne.jours.find((jour) => jour.date === pointage.date)
    : undefined;
  const presence = pointage && utilisateur && entrepriseActive
    ? construirePresenceJournee({
        entrepriseId: entrepriseActive.id,
        utilisateurId: utilisateur.id,
        date: pointage.date,
        jour: jourPlanning,
        pointages: [...obtenirPointagesJour(pointage.date).filter((element) => element.id !== pointage.id), pointage],
      })
    : undefined;
  const confirmation = pointage && utilisateur
    ? <ConfirmationPointage pointage={pointage} utilisateur={utilisateur} presence={presence} ambiance={ambiancePointage} avatar={avatar} onFermer={reinitialiser} />
    : undefined;

  return <PadLayout overlay={confirmation}>
    {etape === "ACCUEIL" ? <PadAccueil entreprise={entrepriseActive.nom} onPrendreService={() => choisirAction("ARRIVEE")} onTerminerService={() => choisirAction("DEPART_SERVICE")} /> : null}
    {etape === "SELECTION" ? <SelectionUtilisateur selectionId={utilisateur?.id} onSelectionner={choisirUtilisateur} onRetour={reinitialiser} /> : null}
    {etape === "PIN" && utilisateur ? <ValidationPin utilisateur={utilisateur} erreur={erreurPin ? "PIN incorrect" : undefined} enCours={enCours} onValider={(pin) => void validerPin(pin)} onRetour={() => { setEtape("SELECTION"); setErreurPin(false); }} /> : null}
  </PadLayout>;
}
