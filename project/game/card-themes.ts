// game/card-themes.ts

export type CardThemeId = 'classic' | 'dragon' | 'ocean' | 'cyber' | 'gold';

export interface CardTheme {
    id: CardThemeId;
    dbid: number;
    name: string;
    price: number;
    frontColor: string;
    backColor: string;
    borderColor: string;
    textColorBlack: string;
    textColorRed: string;
    backIcon: string;
    fontFamily: string;
}

export const CARD_THEMES: Record<CardThemeId, CardTheme> = {
    classic: {
        id: 'classic',
        dbid: 0,
        name: 'Classic Deck',
        price: 0,
        frontColor: '#FFFFFF',
        backColor: '#1a5c3a',
        borderColor: '#FFD700',
        textColorBlack: '#000000',
        textColorRed: '#FF3B30',
        backIcon: '🂠',
        fontFamily: 'Times New Roman'
    },
    dragon: {
        id: 'dragon',
        dbid: 1,
        name: 'Red Dragon',
        price: 500,
        frontColor: '#FFF8DC', // Cornsilk (Parchment look)
        backColor: '#8B0000',  // Dark Red
        borderColor: '#FFD700', // Gold
        textColorBlack: '#1A1A1A',
        textColorRed: '#C00000', // Darker Red
        backIcon: '🐉', // Dragon Emoji
        fontFamily: 'Papyrus'
    },
    ocean: {
        id: 'ocean',
        dbid: 2,
        name: 'Blue Ocean',
        price: 750,
        frontColor: '#F0F8FF', // Alice Blue
        backColor: '#006994',  // Sea Blue
        borderColor: '#40E0D0', // Turquoise
        textColorBlack: '#000080', // Navy
        textColorRed: '#FF7F50',   // Coral
        backIcon: '🌊',
        fontFamily: 'Arial'
    },
    cyber: {
        id: 'cyber',
        dbid: 3,
        name: 'Cyberpunk',
        price: 1500,
        frontColor: '#2B2B2B', // Dark Grey
        backColor: '#000000',
        borderColor: '#39FF14', // Neon Green
        textColorBlack: '#00F0FF', // Neon Blue
        textColorRed: '#FF0099',   // Neon Pink
        backIcon: '⚡',
        fontFamily: 'Courier New'
    },
    gold: {
        id: 'gold',
        dbid: 4,
        name: 'Golden Royale',
        price: 2500,
        frontColor: '#FFFFFF',
        backColor: '#111111',
        borderColor: '#D4AF37', // Gold
        textColorBlack: '#000000',
        textColorRed: '#D4AF37',   // Gold instead of Red
        backIcon: '💎',
        fontFamily: 'Georgia'
    }
};
