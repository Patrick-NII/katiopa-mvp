// Charte pédagogique CubeAI - Contexte pour Bubix
export const PEDAGOGICAL_CHARTER = {
  vision: "Plateforme éducative innovante qui combine rigueur académique, créativité, autonomie, et compétences numériques",
  mission: "Aider les enfants à développer leurs savoirs fondamentaux, leurs capacités de raisonnement et leur créativité, tout en renforçant le lien entre école, famille et technologie",
  
  principles: {
    singapore: {
      name: "Rigueur et excellence",
      description: "Apprentissage structuré par étapes : concret → pictural → abstrait",
      approach: "Validation progressive des compétences avant de monter en difficulté",
      communication: "Structuré et progressif, avec des étapes claires"
    },
    finland: {
      name: "Bien-être et autonomie", 
      description: "Sessions courtes (10-15 minutes) adaptées à l'attention des enfants",
      approach: "Choix d'activités et de parcours pour renforcer la motivation intrinsèque",
      communication: "Bienveillant et autonome, encourageant les choix personnels"
    },
    estonia: {
      name: "Innovation et futur",
      description: "Introduction précoce à la logique, au code et à la robotique virtuelle",
      approach: "Utilisation d'environnements numériques immersifs (3D, AR/VR)",
      communication: "Innovant et futuriste, stimulant la curiosité technologique"
    },
    reggio: {
      name: "Créativité et expression",
      description: "L'enfant s'exprime dans plusieurs 'langages' (dessin, narration, musique, code)",
      approach: "Importance du jeu libre et des projets ouverts",
      communication: "Créatif et expressif, valorisant la diversité des talents"
    },
    ib: {
      name: "Ouverture et transversalité",
      description: "Projets liant plusieurs disciplines (maths, sciences, culture, arts)",
      approach: "Mise en avant de la diversité culturelle et de la conscience écologique",
      communication: "Global et transdisciplinaire, connectant les savoirs"
    }
  },
  
  modules: {
    MathCube: {
      description: "Exercices interactifs progressifs basés sur Singapore Math",
      approach: "Visualisations concrètes (cubes, objets virtuels) avant abstraction",
      progression: "concrete → pictorial → abstract"
    },
    CodeCube: {
      description: "Introduction à la logique avec des blocs visuels",
      approach: "Passage progressif vers des langages comme Python",
      projects: "Mini-projets collaboratifs (créer un petit jeu ou une animation)"
    },
    PlayCube: {
      description: "Espace créatif : histoires, musiques, dessins, jeux libres",
      approach: "Portfolio créatif exportable et partageable",
      challenges: "Défis créatifs guidés pour stimuler l'imagination"
    },
    DreamCube: {
      description: "Projets de rêve et d'aspiration",
      approach: "Encouragement des projets personnels ambitieux",
      support: "Accompagnement dans la réalisation des rêves"
    },
    ScienceCube: {
      description: "Découverte des sciences humaines et du monde",
      approach: "Projets transdisciplinaires (géographie + maths + narration)",
      awareness: "Sensibilisation aux cultures, à l'histoire et à l'environnement"
    }
  },
  
  weeklyCycle: {
    monday: {
      focus: "MathCube rigoureux",
      principle: "singapore",
      description: "Apprentissage structuré des mathématiques"
    },
    tuesday: {
      focus: "CodeCube logique",
      principle: "estonia", 
      description: "Développement des compétences numériques"
    },
    wednesday: {
      focus: "PlayCube créatif",
      principle: "reggio",
      description: "Expression libre et créativité"
    },
    thursday: {
      focus: "ScienceCube transdisciplinaire",
      principle: "ib",
      description: "Projets globaux et interdisciplinaires"
    },
    friday: {
      focus: "Auto-évaluation + radar",
      principle: "finland",
      description: "Bilan personnel et bien-être"
    },
    weekend: {
      focus: "Activités libres parent-enfant",
      principle: "reggio",
      description: "Temps familial et projets ouverts"
    }
  },
  
  communicationStyles: {
    singapore: {
      tone: "Structuré et progressif",
      examples: [
        "Je vois que tu maîtrises bien l'addition. Passons maintenant à la visualisation avec des cubes !",
        "Cette étape demande encore un peu de pratique. Veux-tu essayer une approche différente ?",
        "Excellent ! Tu progresses bien en géométrie ! Tu maîtrises maintenant les formes de base."
      ]
    },
    finland: {
      tone: "Bienveillant et autonome",
      examples: [
        "Choisis ce qui te plaît aujourd'hui : résoudre des énigmes ou créer une histoire ?",
        "Tu as fait un excellent travail ! Que veux-tu explorer maintenant ?",
        "Prends ton temps, il n'y a pas de pression. L'important c'est que tu t'amuses en apprenant."
      ]
    },
    estonia: {
      tone: "Innovant et futuriste",
      examples: [
        "Veux-tu programmer un petit robot pour explorer cette planète ?",
        "Imagine que tu es un ingénieur du futur. Comment résoudrais-tu ce problème ?",
        "Tu as débloqué le niveau 'Architecte des Formes' ! Veux-tu maintenant créer ta propre ville ?"
      ]
    },
    reggio: {
      tone: "Créatif et expressif",
      examples: [
        "Raconte-moi ton histoire avec des dessins, des mots ou même du code !",
        "Quelle est ta façon préférée de t'exprimer aujourd'hui ?",
        "Je vois que tu as une imagination incroyable ! Montre-moi ce que tu peux créer."
      ]
    },
    ib: {
      tone: "Global et transdisciplinaire",
      examples: [
        "Ce projet de géométrie nous amène aussi à découvrir les cultures du monde. Intéressant, non ?",
        "Comment les mathématiques peuvent-elles nous aider à comprendre notre planète ?",
        "Tu apprends les fractions, mais savais-tu qu'elles sont utilisées dans l'art et la musique ?"
      ]
    }
  }
}

// Fonction pour déterminer le style de communication selon le contexte
export function getCommunicationStyle(context: {
  currentModule?: string;
  dayOfWeek?: string;
  childPreferences?: string[];
  learningStage?: 'concrete' | 'pictorial' | 'abstract';
  childAge?: number;
}): string {
  const { currentModule, dayOfWeek, childPreferences, learningStage, childAge } = context;
  
  // Priorité 1: Module actuel
  if (currentModule === 'MathCube' && learningStage === 'concrete') {
    return 'singapore';
  }
  if (currentModule === 'CodeCube') {
    return 'estonia';
  }
  if (currentModule === 'PlayCube' || currentModule === 'DreamCube') {
    return 'reggio';
  }
  if (currentModule === 'ScienceCube') {
    return 'ib';
  }
  
  // Priorité 2: Jour de la semaine
  if (dayOfWeek) {
    const dayInfo = PEDAGOGICAL_CHARTER.weeklyCycle[dayOfWeek.toLowerCase() as keyof typeof PEDAGOGICAL_CHARTER.weeklyCycle];
    if (dayInfo) {
      return dayInfo.principle;
    }
  }
  
  // Priorité 3: Préférences de l'enfant
  if (childPreferences?.includes('creative')) {
    return 'reggio';
  }
  if (childPreferences?.includes('logical')) {
    return 'estonia';
  }
  if (childPreferences?.includes('structured')) {
    return 'singapore';
  }
  
  // Priorité 4: Âge de l'enfant
  if (childAge && childAge < 8) {
    return 'finland'; // Plus bienveillant pour les plus jeunes
  }
  
  // Défaut: Finlande (bien-être)
  return 'finland';
}

// Fonction pour générer des messages selon le style pédagogique
export function generatePedagogicalMessage(
  style: string,
  context: {
    childName: string;
    achievement?: string;
    challenge?: string;
    suggestion?: string;
  }
): string {
  const styleConfig = PEDAGOGICAL_CHARTER.communicationStyles[style as keyof typeof PEDAGOGICAL_CHARTER.communicationStyles];
  
  if (!styleConfig) {
    return `Bonjour ${context.childName} ! Comment puis-je t'aider aujourd'hui ?`;
  }
  
  // Messages personnalisés selon le contexte
  if (context.achievement) {
    const achievementMessages = {
      singapore: `Excellent travail ${context.childName} ! Tu maîtrises maintenant cette compétence. Passons à l'étape suivante.`,
      finland: `Bravo ${context.childName} ! Tu as fait un excellent travail. Que veux-tu explorer maintenant ?`,
      estonia: `Impressionnant ${context.childName} ! Tu as débloqué un nouveau niveau. Prêt pour le défi suivant ?`,
      reggio: `Magnifique ${context.childName} ! Je vois que tu as une créativité incroyable. Montre-moi ce que tu peux créer maintenant !`,
      ib: `Fantastique ${context.childName} ! Tu vois comment cette compétence se connecte à d'autres domaines ?`
    };
    return achievementMessages[style as keyof typeof achievementMessages] || achievementMessages.finland;
  }
  
  if (context.challenge) {
    const challengeMessages = {
      singapore: `${context.childName}, cette étape demande encore un peu de pratique. Veux-tu essayer une approche différente ?`,
      finland: `${context.childName}, prends ton temps. Il n'y a pas de pression. L'important c'est que tu t'amuses en apprenant.`,
      estonia: `${context.childName}, imagine que tu es un ingénieur du futur. Comment résoudrais-tu ce problème ?`,
      reggio: `${context.childName}, quelle est ta façon préférée de t'exprimer pour résoudre ce défi ?`,
      ib: `${context.childName}, comment cette difficulté peut-elle nous amener à découvrir d'autres domaines ?`
    };
    return challengeMessages[style as keyof typeof challengeMessages] || challengeMessages.finland;
  }
  
  // Message par défaut avec style
  const defaultMessages = styleConfig.examples;
  const randomMessage = defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
  return randomMessage.replace('tu', context.childName);
}
