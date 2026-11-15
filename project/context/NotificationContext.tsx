import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { WebNotificationManager } from "@/lib/web-notification-manager";
import type { RealtimeChannel } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { ReactNode, useEffect, useRef } from "react";
import { Platform } from "react-native";

type GameNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
  target_screen?: string | null;
};

// Only set notification handler for native platforms
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: true,
    }),
  });
}

const resolveTarget = (target?: string | null) => {
  if (!target) return null;
  try {
    const [path, query] = target.split("?");
    if (!query) return { pathname: path, params: {} };

    const params = Object.fromEntries(new URLSearchParams(query) as any);
    return { pathname: path, params };
  } catch {
    return { pathname: target, params: {} };
  }
};

const ensurePermissions = async (): Promise<boolean> => {
  // Web platform
  if (Platform.OS === "web") {
    const webNotificationManager = WebNotificationManager.getInstance();
    return await webNotificationManager.requestPermission();
  }

  // Native platforms
  const settings = await Notifications.getPermissionsAsync();
  if (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const request = await Notifications.requestPermissionsAsync();
  return (
    request.granted ||
    request.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
};

const scheduleSystemNotification = async (notification: GameNotification) => {
  const allowed = await ensurePermissions();
  if (!allowed) {
    console.warn("Notificações do sistema não autorizadas");
    return;
  }

  // Web platform
  if (Platform.OS === "web") {
    const webNotificationManager = WebNotificationManager.getInstance();
    const webNotif = await webNotificationManager.showNotification(
      notification.title,
      {
        body: notification.body,
        data: { target_screen: notification.target_screen },
        tag: notification.id,
        requireInteraction: false,
      },
    );

    // Handle notification click on web
    if (webNotif) {
      webNotif.onclick = () => {
        const dest = resolveTarget(notification.target_screen);
        if (dest) {
          try {
            if (dest.params && Object.keys(dest.params).length > 0) {
              router.push({
                pathname: dest.pathname as any,
                params: dest.params as any,
              });
            } else {
              router.push(dest.pathname as any);
            }
          } catch (e) {
            console.warn("Falha ao navegar via notificação web:", e);
          }
        }
        webNotif.close();
      };
    }
    return;
  }

  // Native platforms
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title,
      body: notification.body,
      data: { target_screen: notification.target_screen },
    },
    trigger: null,
  });
};

const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
) => {
  const target = response.notification.request.content.data?.target_screen;
  if (!target || typeof target !== "string") return;

  const dest = resolveTarget(target);
  if (!dest) return;

  try {
    if (dest.params && Object.keys(dest.params).length > 0) {
      router.push({
        pathname: dest.pathname as any,
        params: dest.params as any,
      });
    } else {
      router.push(dest.pathname as any);
    }
  } catch (e) {
    console.warn("Falha ao navegar via notificação do sistema:", e);
  }
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { playerId, session } = useAuth();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionRef = useRef<typeof session>(null);

  // Only set up native notification response listener on native platforms
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );
    return () => subscription.remove();
  }, []);

  // Request permissions when user logs in
  useEffect(() => {
    if (!session) return;
    ensurePermissions().catch((err) =>
      console.warn("Falha ao obter permissões de notificação:", err),
    );
  }, [session]);

  // Set up Supabase realtime channel for notifications
  useEffect(() => {
    sessionRef.current = session;

    // Always tear down previous channel when dependencies change
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    if (!session) {
      seenIdsRef.current = new Set();

      // Clear notifications on logout
      if (Platform.OS !== "web") {
        Notifications.cancelAllScheduledNotificationsAsync().catch((err) =>
          console.warn(
            "Falha ao cancelar notificações ao sair da sessão:",
            err,
          ),
        );
        Notifications.dismissAllNotificationsAsync().catch((err) =>
          console.warn("Falha ao limpar notificações entregues:", err),
        );
      }
      return;
    }

    if (!playerId) return;

    const channel = supabase
      .channel(`notifications-channel-${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `player_id=eq.${playerId}`,
        },
        async (payload) => {
          if (!sessionRef.current) return; // guard against late events after logout
          const notif = payload.new as GameNotification;
          if (seenIdsRef.current.has(notif.id)) return;
          seenIdsRef.current.add(notif.id);
          await scheduleSystemNotification(notif);
        },
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [playerId, session]);

  return <>{children}</>;
}
