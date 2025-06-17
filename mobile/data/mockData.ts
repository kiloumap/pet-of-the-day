import { Pet, Group, Action } from '../types';

export const pets: Pet[] = [
    { id: 1, name: "Archie", breed: "Corgi", age: "5 ans", ageInMonths: 60, points: 23, image: "🐕", isOwn: true },
    { id: 2, name: "Arthas", breed: "Mini Aussie", age: "9 mois", ageInMonths: 9, points: 18, image: "🐕‍🦺", isOwn: true },
    { id: 3, name: "Betty", breed: "Corgi", age: "3 ans",  ageInMonths: 36, points: 18, image: "🐶", isOwn: false },
];

export const groups: Group[] = [
    { id: 1, name: "Mes Chiens", members: 2, type: "personal" },
    { id: 2, name: "Parc a chien", members: 12, type: "neighborhood" },
    { id: 3, name: "Mes chums", members: 8, type: "friends" }
];

export interface Action {
    id: number;
    text: string;
    points: number;
    icon: string;
    category: string;
    ageGroup?: 'chiot' | 'adulte' | 'senior' | 'all';
    isFirstTry?: boolean;
    hasWitnesses?: boolean;
}

export interface Multiplier {
    name: string;
    factor: number;
    description: string;
}

export const baseActions: Action[] = [
    { id: 1, text: "Pipi dehors", points: 5, icon: "✅", category: "propreté" },
    { id: 2, text: "Accident dedans", points: -3, icon: "❌", category: "propreté" },
    { id: 3, text: "Sage en promenade", points: 8, icon: "🚶", category: "comportement" },
    { id: 4, text: "Tire en laisse", points: -2, icon: "➰", category: "comportement" },
    { id: 5, text: "Obéit aux ordres", points: 10, icon: "👂", category: "éducation" },
    { id: 6, text: "Socialise bien", points: 6, icon: "🐕‍🦺", category: "social" }
];

// 🐶 CHIOTS (0-12 mois) - Focus : Apprentissage & Socialisation
export const chiotActions: Action[] = [
    // Propreté (critère majeur)
    { id: 101, text: "Pipi/caca dehors", points: 5, icon: "✅", category: "propreté", ageGroup: 'chiot' },
    { id: 102, text: "Demande pour sortir", points: 8, icon: "🚪", category: "propreté", ageGroup: 'chiot' },
    { id: 103, text: "Nuit propre complète", points: 10, icon: "🌙", category: "propreté", ageGroup: 'chiot' },
    { id: 104, text: "Accident dedans", points: -1, icon: "❌", category: "propreté", ageGroup: 'chiot' },

    // Socialisation (super important)
    { id: 105, text: "Rencontre nouveau chien calmement", points: 6, icon: "🐕", category: "social", ageGroup: 'chiot' },
    { id: 106, text: "Rencontre nouvel humain", points: 4, icon: "👋", category: "social", ageGroup: 'chiot' },
    { id: 107, text: "Découverte nouveau lieu", points: 8, icon: "🗺️", category: "social", ageGroup: 'chiot' },
    { id: 108, text: "Première fois transport", points: 10, icon: "🚗", category: "social", ageGroup: 'chiot' },
    { id: 109, text: "Reste calme bruits forts", points: 12, icon: "🔊", category: "social", ageGroup: 'chiot' },

    // Éducation de base
    { id: 110, text: "Répond à son nom", points: 3, icon: "📢", category: "éducation", ageGroup: 'chiot' },
    { id: 111, text: "Assis sur commande", points: 4, icon: "⬇️", category: "éducation", ageGroup: 'chiot' },
    { id: 112, text: "Reste/attendre", points: 5, icon: "✋", category: "éducation", ageGroup: 'chiot' },
    { id: 113, text: "Marche en laisse 5 min", points: 6, icon: "🚶‍♂️", category: "éducation", ageGroup: 'chiot' },
    { id: 114, text: "Rappel réussi", points: 8, icon: "↩️", category: "éducation", ageGroup: 'chiot' },

    // Malus légers (apprentissage)
    { id: 115, text: "Mordille/détruit", points: -2, icon: "🦷", category: "comportement", ageGroup: 'chiot' },
    { id: 116, text: "Aboie excessivement", points: -2, icon: "🔊", category: "comportement", ageGroup: 'chiot' }
];

// 🐕 ADULTES (1-7 ans) - Focus : Maintien & Performance
export const adulteActions: Action[] = [
    // Obéissance (standard élevé)
    { id: 201, text: "Rappel immédiat", points: 4, icon: "⚡", category: "comportement", ageGroup: 'adulte' },
    { id: 202, text: "Marche parfaite en laisse", points: 3, icon: "🎯", category: "comportement", ageGroup: 'adulte' },
    { id: 203, text: "Reste calme visites", points: 4, icon: "🏠", category: "comportement", ageGroup: 'adulte' },
    { id: 204, text: "Ordres complexes", points: 6, icon: "🧠", category: "comportement", ageGroup: 'adulte' },
    { id: 205, text: "Ignore distractions", points: 5, icon: "🎯", category: "comportement", ageGroup: 'adulte' },

    // Comportement social
    { id: 206, text: "Jeu équilibré autres chiens", points: 4, icon: "⚖️", category: "social", ageGroup: 'adulte' },
    { id: 207, text: "Protège/aide faible", points: 8, icon: "🛡️", category: "social", ageGroup: 'adulte' },
    { id: 208, text: "Calme avec enfants", points: 5, icon: "👶", category: "social", ageGroup: 'adulte' },
    { id: 209, text: "Comportement exemplaire public", points: 6, icon: "⭐", category: "social", ageGroup: 'adulte' },

    // Performance
    { id: 210, text: "Nouveau trick maîtrisé", points: 10, icon: "🎪", category: "éducation", ageGroup: 'adulte' },
    { id: 211, text: "Amélioration comportement", points: 8, icon: "📈", category: "éducation", ageGroup: 'adulte' },
    { id: 212, text: "Aide à l'éducation autre chien", points: 12, icon: "👨‍🏫", category: "éducation", ageGroup: 'adulte' },

    // Malus (standards adultes)
    { id: 213, text: "Désobéissance", points: -3, icon: "🚫", category: "comportement", ageGroup: 'adulte' },
    { id: 214, text: "Agressivité", points: -8, icon: "⚠️", category: "comportement", ageGroup: 'adulte' },
    { id: 215, text: "Destruction volontaire", points: -4, icon: "💥", category: "comportement", ageGroup: 'adulte' },
    { id: 216, text: "Fugue", points: -6, icon: "🏃‍♂️", category: "comportement", ageGroup: 'adulte' }
];

// 🐕‍🦺 SENIORS (7+ ans) - Focus : Confort & Sagesse
export const seniorActions: Action[] = [
    // Adaptation/Courage
    { id: 301, text: "Accepte nouveaux soins", points: 6, icon: "💊", category: "comportement", ageGroup: 'senior' },
    { id: 302, text: "Reste actif malgré âge", points: 5, icon: "💪", category: "comportement", ageGroup: 'senior' },
    { id: 303, text: "Surmonte douleur/gêne", points: 8, icon: "🦴", category: "comportement", ageGroup: 'senior' },
    { id: 304, text: "S'adapte aux changements", points: 7, icon: "🔄", category: "comportement", ageGroup: 'senior' },

    // Sagesse & Mentoring
    { id: 305, text: "Calme avec chiots énervés", points: 6, icon: "🧘‍♂️", category: "comportement", ageGroup: 'senior' },
    { id: 306, text: "Guide/rassure autres chiens", points: 8, icon: "🧭", category: "comportement", ageGroup: 'senior' },
    { id: 307, text: "Comportement zen", points: 4, icon: "☯️", category: "comportement", ageGroup: 'senior' },
    { id: 308, text: "Accepte limitations", points: 5, icon: "🤝", category: "comportement", ageGroup: 'senior' },

    // Santé & Bien-être
    { id: 309, text: "Prend médicaments sans souci", points: 4, icon: "💊", category: "comportement", ageGroup: 'senior' },
    { id: 310, text: "Reste propre malgré âge", points: 6, icon: "✨", category: "comportement", ageGroup: 'senior' },
    { id: 311, text: "Garde appétit/joie", points: 5, icon: "😊", category: "comportement", ageGroup: 'senior' },

    // Bonus spéciaux seniors
    { id: 312, text: "Journée particulièrement active", points: 10, icon: "🌟", category: "bonus", ageGroup: 'senior' },
    { id: 313, text: "Moment de tendresse exceptionnel", points: 8, icon: "💝", category: "bonus", ageGroup: 'senior' },

    // Malus adaptés (tolérance)
    { id: 314, text: "Accidents liés à l'âge", points: -1, icon: "💧", category: "propreté", ageGroup: 'senior' },
    { id: 315, text: "Grognements douleur", points: 0, icon: "😣", category: "comportement", ageGroup: 'senior' }
];

// Multiplicateurs contextuels
export const multipliers: Multiplier[] = [
    { name: "Premier essai", factor: 1.5, description: "Première fois que le chien réalise cette action" },
    { name: "Progrès constant", factor: 1.2, description: "Action répétée avec succès pendant 3 jours ou plus" },
    { name: "Après maladie/stress", factor: 1.3, description: "Action réalisée après une période difficile" },
    { name: "En public/témoins", factor: 1.1, description: "Action réalisée devant des témoins" }
];

// Fonction pour obtenir toutes les actions selon l'âge
export const getActionsByAge = (ageGroup: 'chiot' | 'adulte' | 'senior'): Action[] => {
    const allActions = [...baseActions];

    switch (ageGroup) {
        case 'chiot':
            return [...allActions, ...chiotActions];
        case 'adulte':
            return [...allActions, ...adulteActions];
        case 'senior':
            return [...allActions, ...seniorActions];
        default:
            return allActions;
    }
};

// Fonction pour calculer les points avec multiplicateurs
export const calculatePoints = (
    basePoints: number,
    multiplierNames: string[] = []
): number => {
    let finalPoints = basePoints;

    multiplierNames.forEach(name => {
        const multiplier = multipliers.find(m => m.name === name);
        if (multiplier) {
            finalPoints *= multiplier.factor;
        }
    });

    return Math.round(finalPoints);
};

// Export de toutes les actions combinées
export const allActions: Action[] = [
    ...baseActions,
    ...chiotActions,
    ...adulteActions,
    ...seniorActions
];