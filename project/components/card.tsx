// components/Card.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { CARD_THEMES, CardThemeId } from '@/game/card-themes';
import { th } from 'react-native-paper-dates';

interface CardProps {
    suit?: string;
    rank?: string;
    onPress?: () => void;
    style?: any;
    faceDown?: boolean;
    disabled?: boolean;
    animated?: boolean;
    themeId?: CardThemeId;
}

export const Card: React.FC<CardProps> = ({
    suit,
    rank,
    onPress,
    style,
    faceDown = false,
    disabled = false,
    animated = false,
    themeId = 'classic'
}) => {
    const suitSymbols: Record<string, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };

    const suitColors: Record<string, string> = {
        hearts: '#FF3B30',
        diamonds: '#FF3B30',
        clubs: '#000',
        spades: '#000'
    };

    const theme = CARD_THEMES[themeId] || CARD_THEMES['classic'];

    const isRedSuit = suit === 'hearts' || suit === 'diamonds';
    const suitColor = isRedSuit ? theme.textColorRed : theme.textColorBlack;

    const displaySuit = suit ? suitSymbols[suit] : '';

    const CardContent = (
        <>
            {faceDown ? (
                // 3. Apply Theme to Card Back
                <View style={[
                    styles.cardBack,
                    {
                        backgroundColor: theme.backColor,
                        borderColor: theme.borderColor
                    }
                ]}>
                    <Text style={[styles.cardBackText, { color: theme.borderColor }]}>
                        {theme.backIcon}
                    </Text>
                </View>
            ) : (
                // 4. Apply Theme to Card Front
                <View style={[styles.cardFace, { backgroundColor: theme.frontColor }]}>
                    <Text style={[styles.cardRank, { color: suitColor, fontFamily: theme.fontFamily}]}>{rank}</Text>
                    <Text style={[styles.cardSuit, { color: suitColor }]}>{displaySuit}</Text>
                    <Text style={[styles.cardRankBottom, { color: suitColor, fontFamily: theme.fontFamily }]}>{rank}</Text>
                </View>
            )}
        </>
    );

    if (animated) {
        return (
            <Animated.View style={[styles.card, style]}>
                {CardContent}
            </Animated.View>
        );
    }

    return (
        <Pressable
            onPress={() => {
                if (onPress && !disabled && !faceDown) {
                    onPress();
                }
            }}
            disabled={disabled || faceDown}
            style={({ pressed }) => [
                styles.card,
                style,
                pressed && !disabled && styles.cardPressed
            ]}
            testID='card-component'
        >
            {CardContent}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 60,
        height: 90,
        borderRadius: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        overflow: 'hidden',
    },
    cardFace: {
        flex: 1,
        padding: 6,
        borderRadius: 5,
    },
    cardPressed: {
        transform: [{ scale: 0.95 }],
    },
    cardRank: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSuit: {
        fontSize: 28,
        textAlign: 'center',
        marginTop: 8,
    },
    cardRankBottom: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
        marginTop: 'auto',
    },
    cardBack: {
        flex: 1,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    cardBackText: {
        fontSize: 56,
        marginTop: 4,
        color: '#FFD700',
    },
});
