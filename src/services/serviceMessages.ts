import type { Pointage } from "@/types/pointage";
import type {
  AmbiancePointage,
  ServiceMessage,
  TypeServiceAmbiance,
} from "@/types/ambiance";
import type { Utilisateur } from "@/types/entreprise";

export const SERVICE_MESSAGES_PAR_DEFAUT: readonly ServiceMessage[] = [
  { id:"arrivee-1", typeService:"ARRIVEE_MATIN", titre:"Coucou ! 👑", message:"L'empire te souhaite une belle matinée 🌞☕", emojis:["🌅", "☕"], actif:true },
  { id:"arrivee-2", typeService:"ARRIVEE_MATIN", titre:"Coucou ! 👑", message:"Nouvelle quête débloquée : réussir le service du jour ⚔️✨", emojis:["⚔️", "✨"], actif:true },
  { id:"arrivee-3", typeService:"ARRIVEE_MATIN", titre:"Coucou ! 👑", message:"Le café est chaud, l'équipe est prête ☕🔥", emojis:["☕", "🔥"], actif:true },
  { id:"arrivee-4", typeService:"ARRIVEE_MATIN", titre:"Coucou ! 👑", message:"Bienvenue dans l'arène du service 💪👑", emojis:["💪", "👑"], actif:true },
  { id:"coupure-1", typeService:"DEPART_COUPURE", titre:"Pause du guerrier 🛡️", message:"Bonne sieste, a touuuute :) 😴💤", emojis:["😴", "💤"], actif:true },
  { id:"coupure-2", typeService:"DEPART_COUPURE", titre:"Pause du guerrier 🛡️", message:"Recharge tes batteries, le prochain service arrive ⚡🔋", emojis:["⚡", "🔋"], actif:true },
  { id:"coupure-3", typeService:"DEPART_COUPURE", titre:"Pause du guerrier 🛡️", message:"Mission accomplie pour maintenant, repos bien mérité 🏆", emojis:["🏆"], actif:true },
  { id:"coupure-4", typeService:"DEPART_COUPURE", titre:"Pause du guerrier 🛡️", message:"Va manger, dormir, respirer... l'empire a besoin de toi 😄", emojis:["😄"], actif:true },
  { id:"reprise-1", typeService:"REPRISE_SOIR", titre:"Le deuxième round commence ⚔️", message:"Vivement ce soir qu'on se couche ;) 😂🌙", emojis:["😂", "🌙"], actif:true },
  { id:"reprise-2", typeService:"REPRISE_SOIR", titre:"Le deuxième round commence ⚔️", message:"Retour dans l'arène, que la force soit avec toi 💪🔥", emojis:["💪", "🔥"], actif:true },
  { id:"reprise-3", typeService:"REPRISE_SOIR", titre:"Le deuxième round commence ⚔️", message:"Le service du soir n'attend plus que toi 🚀", emojis:["🚀"], actif:true },
  { id:"reprise-4", typeService:"REPRISE_SOIR", titre:"Le deuxième round commence ⚔️", message:"L'empire rappelle ses meilleurs éléments 👑", emojis:["👑"], actif:true },
  { id:"fin-1", typeService:"DEPART_FIN_JOURNEE", titre:"Mission terminée 👑", message:"L'empire te remercie 💪❤️", emojis:["💪", "❤️"], actif:true },
  { id:"fin-2", typeService:"DEPART_FIN_JOURNEE", titre:"Mission terminée 👑", message:"Encore une bataille remportée 🏆⚔️", emojis:["🏆", "⚔️"], actif:true },
  { id:"fin-3", typeService:"DEPART_FIN_JOURNEE", titre:"Mission terminée 👑", message:"Service terminé, héros du jour validé ⭐", emojis:["⭐"], actif:true },
  { id:"fin-4", typeService:"DEPART_FIN_JOURNEE", titre:"Mission terminée 👑", message:"Tu peux ranger l'armure, elle est méritée 😄🛡️", emojis:["😄", "🛡️"], actif:true },
] as const;

const LIBELLES_ROLE: Record<Utilisateur["role"], string> = {
  GERANT: "Gérant",
  CHEF_CUISINE: "Chef de cuisine",
  MAITRE_HOTEL: "Maître d'hôtel",
  SALARIE: "Salarié",
};

export function determinerTypeServiceAmbiance(
  pointage: Pointage,
  historique: Pointage[]
): TypeServiceAmbiance {
  if (pointage.type === "ARRIVEE") return "ARRIVEE_MATIN";
  if (pointage.type === "DEPART_PAUSE") return "DEPART_COUPURE";
  if (pointage.type === "REPRISE_PAUSE") return "REPRISE_SOIR";
  return "DEPART_FIN_JOURNEE";
}

export function creerAmbiancePointage({
  pointage,
  utilisateur,
  historique,
  messages = SERVICE_MESSAGES_PAR_DEFAUT,
}: {
  pointage: Pointage;
  utilisateur: Utilisateur;
  historique: Pointage[];
  messages?: readonly ServiceMessage[];
}): AmbiancePointage | null {
  const typeService = determinerTypeServiceAmbiance(pointage, historique);
  const disponibles = messages.filter(
    (message) => message.actif && message.typeService === typeService
  );

  if (disponibles.length === 0) {
    return null;
  }

  const selection = disponibles[Math.floor(Math.random() * disponibles.length)];

  return {
    pointageId:pointage.id,
    utilisateurId:utilisateur.id,
    prenom:utilisateur.nom.trim().split(/\s+/)[0] || utilisateur.nom,
    poste:utilisateur.poste?.trim() || LIBELLES_ROLE[utilisateur.role],
    heure:pointage.heure.slice(0, 5),
    typeService,
    titre:selection.titre,
    message:selection.message,
    emojis:[...selection.emojis],
  };
}
