// context/AuthContext.tsx
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import React, { createContext, useEffect, useState, useCallback } from "react";

interface AuthContextType {
  playerId: string | null;
  session: Session | null;
  username: string | null;
  avatarUrl: string | null;
  coins: number | null;
  refreshProfile: () => Promise<void>; // Add this
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract profile fetching into a separate function
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, avatar, coins, id, avatars(url)")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  }, []);

  // Public refresh function that can be called from anywhere
  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    const data = await fetchProfile(session.user.id);
    if (data) {
      setUsername(data.username);
      setAvatarUrl(data.avatars?.url || null);
      setCoins(data.coins);
      setPlayerId(data.id);
    }
  }, [session, fetchProfile]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          const data = await fetchProfile(session.user.id);
          if (data) {
            setUsername(data.username);
            setAvatarUrl(data.avatars?.url || null);
            setCoins(data.coins);
            setPlayerId(data.id);
          }
        }
      } catch (err: any) {
        console.warn("Auth getSession failed, clearing session:", err?.message);
        await supabase.auth.signOut();
        setSession(null);
        setUsername(null);
        setAvatarUrl(null);
        setCoins(null);
        setPlayerId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (session) {
          const data = await fetchProfile(session.user.id);
          if (data) {
            setUsername(data.username);
            setAvatarUrl(data.avatars?.url || null);
            setCoins(data.coins);
            setPlayerId(data.id);
          }
        } else {
          setUsername(null);
          setAvatarUrl(null);
          setCoins(null);
          setPlayerId(null);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [fetchProfile]);

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        username,
        avatarUrl,
        coins,
        playerId,
        refreshProfile, // Expose refresh function
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
