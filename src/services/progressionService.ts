import type {
  ActionProgression,
  ParametresAttributionPoints,
  TypeActionProgression,
} from "@/types/reward";

type RegleProgression = {
  points: (action: ParametresAttributionPoints) => number;
  description: string;
};

const REGLES_PROGRESSION: Record<TypeActionProgression, RegleProgression> = {
  RELEVE_TEMPERATURE: {
    points: ({ conformite }) => conformite ? 5 : 0,
    description: "Relevé de température conforme",
  },
  CONTROLE_HACCP: {
    points: ({ conformite }) => conformite ? 5 : 0,
    description: "Contrôle HACCP conforme",
  },
  PREUVE_PHOTO: {
    points: () => 3,
    description: "Preuve photo ajoutée au relevé",
  },
  ANOMALIE_TRAITEE: {
    points: ({ conformite }) => conformite ? 5 : 0,
    description: "Anomalie correctement traitée",
  },
  ACTION_CORRECTIVE_VALIDEE: {
    points: ({ validation }) => validation ? 10 : 0,
    description: "Action corrective validée",
  },
  VALIDATION_RESPONSABLE: {
    points: ({ validation }) => validation ? 5 : 0,
    description: "Validation responsable réussie",
  },
  RELEVE_CONFORME_VALIDE: {
    points: () => 0,
    description: "Premier relevé conforme validé",
  },
  JOURNEE_COMPLETE_HACCP: {
    points: ({ conformite, validation }) => conformite && validation ? 20 : 0,
    description: "Journée complète sans oubli HACCP",
  },
  SEMAINE_PARFAITE: {
    points: ({ conformite, validation }) => conformite && validation ? 100 : 0,
    description: "Semaine HACCP parfaite",
  },
  OUBLI_CRITIQUE: {
    points: () => -20,
    description: "Oubli critique HACCP",
  },
  NON_VALIDATION_OBLIGATOIRE: {
    points: ({ validation }) => validation ? 0 : -10,
    description: "Action obligatoire non validée",
  },
};

function estTypeActionProgression(type: string): type is TypeActionProgression {
  return type in REGLES_PROGRESSION;
}

export function attribuerPointsAction(
  action: ParametresAttributionPoints
): ActionProgression {
  const regle = estTypeActionProgression(action.typeAction)
    ? REGLES_PROGRESSION[action.typeAction]
    : {
        points: () => 0,
        description: `Action non barémée : ${action.typeAction}`,
      };
  const maintenant = new Date();

  return {
    id: `${maintenant.getTime()}-${Math.random().toString(16).slice(2)}`,
    type: action.typeAction,
    points: regle.points(action),
    description: regle.description,
    date: maintenant.toISOString(),
    utilisateurId: action.utilisateurId,
    entrepriseId: action.entrepriseId,
  };
}
