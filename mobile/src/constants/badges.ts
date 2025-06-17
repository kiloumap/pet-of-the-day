import { Badge } from '../../types/badges';

export const BADGES: Badge[] = [
    // 🚽 PROPRETÉ
    {
        id: 'first_outdoor_pee',
        name: 'Premier pipi dehors',
        description: 'A fait son premier pipi à l\'extérieur !',
        icon: '🎯',
        color: '#10b981',
        rarity: 'common',
        category: 'propreté',
        requirements: {
            type: 'specific_action',
            specificActionId: 101, // Pipi/caca dehors (chiot)
            conditions: { ageGroup: 'chiot' }
        }
    },
    {
        id: 'potty_champion',
        name: 'Champion Pipi',
        description: 'A fait ses besoins dehors 10 fois !',
        icon: '🏆',
        color: '#f59e0b',
        rarity: 'rare',
        category: 'propreté',
        requirements: {
            type: 'action_count',
            actionIds: [101, 1], // Pipi dehors (chiot + général)
            count: 10,
            timeframe: 'all_time'
        }
    },
    {
        id: 'clean_week',
        name: 'Semaine Propre',
        description: '7 jours consécutifs sans accident !',
        icon: '✨',
        color: '#8b5cf6',
        rarity: 'epic',
        category: 'propreté',
        requirements: {
            type: 'streak',
            consecutiveDays: 7,
            streakActionIds: [101, 1] // Pas d'accidents
        }
    },

    // 🎓 ÉDUCATION
    {
        id: 'first_sit',
        name: 'Premier Assis',
        description: 'A obéi à l\'ordre "assis" pour la première fois !',
        icon: '🎓',
        color: '#3b82f6',
        rarity: 'common',
        category: 'éducation',
        requirements: {
            type: 'specific_action',
            specificActionId: 111, // Assis sur commande
            conditions: { ageGroup: 'chiot' }
        }
    },
    {
        id: 'obedience_master',
        name: 'Maître de l\'Obéissance',
        description: 'A obéi aux ordres 25 fois !',
        icon: '👨‍🏫',
        color: '#f59e0b',
        rarity: 'rare',
        category: 'éducation',
        requirements: {
            type: 'action_count',
            actionIds: [5, 110, 111, 112, 114], // Tous les ordres
            count: 25,
            timeframe: 'all_time'
        }
    },
    {
        id: 'trick_master',
        name: 'Roi des Tours',
        description: 'A maîtrisé un nouveau tour !',
        icon: '🎪',
        color: '#ef4444',
        rarity: 'epic',
        category: 'éducation',
        requirements: {
            type: 'specific_action',
            specificActionId: 210, // Nouveau trick maîtrisé
            conditions: { ageGroup: 'adulte' }
        }
    },

    // 🐕 SOCIAL
    {
        id: 'social_butterfly',
        name: 'Papillon Social',
        description: 'A rencontré 5 nouveaux chiens !',
        icon: '🦋',
        color: '#ec4899',
        rarity: 'rare',
        category: 'social',
        requirements: {
            type: 'action_count',
            actionIds: [105], // Rencontre nouveau chien
            count: 5,
            timeframe: 'month'
        }
    },
    {
        id: 'peacekeeper',
        name: 'Gardien de la Paix',
        description: 'A calmé un autre chien énervé !',
        icon: '☮️',
        color: '#8b5cf6',
        rarity: 'epic',
        category: 'social',
        requirements: {
            type: 'specific_action',
            specificActionId: 305, // Calme avec chiots énervés
            conditions: { ageGroup: 'senior' }
        }
    },

    // 🔥 STREAKS
    {
        id: 'daily_warrior',
        name: 'Guerrier Quotidien',
        description: '3 jours consécutifs avec des points positifs !',
        icon: '🔥',
        color: '#f97316',
        rarity: 'common',
        category: 'streak',
        requirements: {
            type: 'streak',
            consecutiveDays: 3,
            streakActionIds: [] // Toute action positive
        }
    },
    {
        id: 'perfect_week',
        name: 'Semaine Parfaite',
        description: '7 jours consécutifs au top du classement !',
        icon: '🌟',
        color: '#fbbf24',
        rarity: 'legendary',
        category: 'streak',
        requirements: {
            type: 'points_total',
            minPoints: 50,
            timeframe: 'week'
        }
    },

    // 🎯 SPÉCIAUX
    {
        id: 'first_day',
        name: 'Bienvenue !',
        description: 'Première journée dans Pet of the Day !',
        icon: '🎉',
        color: '#06b6d4',
        rarity: 'common',
        category: 'special',
        requirements: {
            type: 'time_based',
            timeCondition: { type: 'first_week' }
        }
    },
    {
        id: 'night_owl',
        name: 'Chouette de Nuit',
        description: 'Nuit complète sans accident !',
        icon: '🦉',
        color: '#6366f1',
        rarity: 'rare',
        category: 'propreté',
        requirements: {
            type: 'specific_action',
            specificActionId: 103, // Nuit propre complète
        }
    },
    {
        id: 'combo_master',
        name: 'Maître Combo',
        description: 'A réalisé 3 actions positives en une journée !',
        icon: '⚡',
        color: '#f59e0b',
        rarity: 'rare',
        category: 'special',
        requirements: {
            type: 'combo',
            comboActionIds: [], // Toute action positive
            count: 3
        }
    },

    // 🏅 PERFORMANCE
    {
        id: 'point_collector',
        name: 'Collectionneur de Points',
        description: 'A accumulé 100 points au total !',
        icon: '💎',
        color: '#84cc16',
        rarity: 'epic',
        category: 'special',
        requirements: {
            type: 'points_total',
            minPoints: 100,
            timeframe: 'all_time'
        }
    },
    {
        id: 'daily_champion',
        name: 'Champion du Jour',
        description: 'A été Pet of the Day !',
        icon: '👑',
        color: '#fbbf24',
        rarity: 'epic',
        category: 'special',
        requirements: {
            type: 'points_total',
            minPoints: 20,
            timeframe: 'day'
        }
    }
];

// Helper pour récupérer les badges par catégorie
export const getBadgesByCategory = (category: Badge['category']) =>
    BADGES.filter(badge => badge.category === category);

// Helper pour récupérer les badges par rareté
export const getBadgesByRarity = (rarity: Badge['rarity']) =>
    BADGES.filter(badge => badge.rarity === rarity);

// Couleurs par rareté
export const RARITY_COLORS = {
    common: '#6b7280',
    rare: '#3b82f6',
    epic: '#8b5cf6',
    legendary: '#f59e0b'
};

// Ordre de rareté (pour le tri)
export const RARITY_ORDER = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4
};