import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

export interface Avatar {
  id: string;
  name: string;
  url: string;
  price: number;
}

export interface AvatarWithImageUrl extends Avatar {
  imageUrl: string;
}

export function useAvatar() {
  const { session } = useAuth();
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [ownedAvatars, setOwnedAvatars] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAvailableAvatars = useCallback(async (): Promise<Avatar[]> => {
    try {
      const { data, error } = await supabase
        .from('avatars')
        .select('id, url, name, price');

      if (error) {
        console.error('Error fetching avatars:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching avatars:', err);
      return [];
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!session?.user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('coins, owned_avatars, avatar')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCoins(data.coins || 0);
        setOwnedAvatars(data.owned_avatars || []);
        setCurrentAvatar(data.avatar || null);
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

  const equipAvatar = useCallback(async (avatarId: string) => {
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: avatarId })
        .eq('id', session.user.id);

      if (error) throw error;

      setCurrentAvatar(avatarId);

      await fetchUserProfile();

      return { success: true };
    } catch (error) {
      console.error('Error equipping avatar:', error);
      return { success: false, error: 'Failed to equip avatar' };
    }
  }, [session, fetchUserProfile]);

  const buyAvatar = useCallback(async (avatarId: string, price: number) => {
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    try {
      // Check current coins
      if (coins < price) {
            return { success: false, error: `Not enough coins! You need ${price - coins} more.` };
      }

      // Deduct coins and add to owned avatars
      const newCoins = coins - price;
      const newOwnedAvatars = [...ownedAvatars, avatarId];

      const { error } = await supabase
        .from('profiles')
        .update({
          coins: newCoins,
          owned_avatars: newOwnedAvatars,
          avatar: avatarId,
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setCoins(newCoins);
      setOwnedAvatars(newOwnedAvatars);
      setCurrentAvatar(avatarId);

      return { success: true };
    } catch (error) {
      console.error('Error buying avatar:', error);
      return { success: false, error: 'Purchase failed' };
    }
  }, [session, coins, ownedAvatars]);

  return {
    currentAvatar,
    ownedAvatars,
    coins,
    loading,
    equipAvatar,
    buyAvatar,
    fetchAvailableAvatars,
    refreshProfile: fetchUserProfile
  };
}
