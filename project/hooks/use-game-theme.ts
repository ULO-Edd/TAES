import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { CARD_THEMES, CardThemeId } from '@/game/card-themes';
import { Alert } from 'react-native';

export function useGameTheme() {
    const { session } = useAuth();
    const [currentTheme, setCurrentTheme] = useState<CardThemeId>('classic');
    const [ownedThemes, setOwnedThemes] = useState<CardThemeId[]>(['classic']);
    const [coins, setCoins] = useState(0);
    const [loading, setLoading] = useState(true);

    const getThemeDbId = (theme: any) => {
        return theme.dbId !== undefined ? theme.dbId : theme.dbid;
    };

    const getThemeIdFromDbId = (dbId: number): CardThemeId => {
        const theme = Object.values(CARD_THEMES).find(t => getThemeDbId(t) === dbId);
        return theme ? theme.id : 'classic';
    };

    const fetchUserProfile = useCallback(async () => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('coins, owned_themes, selected_theme')
                .eq('id', session.user.id)
                .single();

            if (error) throw error;

            if (data) {
                setCoins(data.coins || 0);
                const owned = (data.owned_themes || []).map((id: number) => getThemeIdFromDbId(id));
                setOwnedThemes(owned.length > 0 ? owned : ['classic']);
                setCurrentTheme(getThemeIdFromDbId(data.selected_theme));
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchUserProfile();
    }, [fetchUserProfile]);

    const equipTheme = async (themeId: CardThemeId) => {
        if (!session?.user) return;

        const prevTheme = currentTheme;
        setCurrentTheme(themeId);
        const dbId = getThemeDbId(CARD_THEMES[themeId]);

        const { error } = await supabase
            .from('profiles')
            .update({ selected_theme: dbId })
            .eq('id', session.user.id);

        if (error) {
            console.error('Error equipping theme:', error);
            setCurrentTheme(prevTheme);
            Alert.alert('Error', 'Could not equip theme');
        }
    };

    const buyTheme = async (themeId: CardThemeId): Promise<{ success: boolean, error?: string }> => {

        if (!session?.user) {
            return { success: false, error: "You must be logged in to buy themes." };
        }

        const theme = CARD_THEMES[themeId];
        const cost = theme.price;

        if (coins < cost) {
            // RETURN FALSE instead of alerting
            return { success: false, error: `Not enough coins! You need ${cost - coins} more.` };
        }

        const dbId = getThemeDbId(theme);
        if (dbId === undefined) {
            return { success: false, error: "Configuration Error: Invalid Theme ID" };
        }

        // ... Logic to calculate new balance ...
        const newCoinBalance = coins - cost;
        const currentOwnedDbIds = ownedThemes.map(id => getThemeDbId(CARD_THEMES[id]));
        const newOwnedDbIds = [...currentOwnedDbIds, dbId];

        // Optimistic Update
        setCoins(newCoinBalance);
        setOwnedThemes(prev => [...prev, themeId]);

        const { error } = await supabase
            .from('profiles')
            .update({
                coins: newCoinBalance,
                owned_themes: newOwnedDbIds
            })
            .eq('id', session.user.id);

        if (error) {
            // Revert changes
            setCoins(coins);
            setOwnedThemes(prev => prev.filter(t => t !== themeId));
            return { success: false, error: "Purchase failed. Please try again." };
        } else {
            return { success: true };
        }
    };

    return {
        currentTheme,
        ownedThemes,
        coins,
        loading,
        equipTheme,
        buyTheme,
        refreshProfile: fetchUserProfile
    };
}
