import AlertBanner from "@/components/alert-banner";
import { Card } from "@/components/card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { CARD_THEMES } from "@/game/card-themes";
import { useAuth } from "@/hooks/use-auth";
import { useAvatar } from "@/hooks/use-avatar";
import { useGameTheme } from "@/hooks/use-game-theme";
import { supabase } from "@/lib/supabase";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

const DEFAULT_AVATARS = [
  { id: "c", url: "c.png", name: "C", price: 100 },
  { id: "gopher", url: "gopher.png", name: "Gopher", price: 150 },
  { id: "inbread", url: "avatar3.png", name: "Inbread", price: 200 },
];

export default function CustomizationScreen() {
  const {
    currentTheme,
    ownedThemes,
    coins: themesCoins,
    loading: themesLoading,
    equipTheme,
    buyTheme,
  } = useGameTheme();
  const {
    currentAvatar,
    ownedAvatars,
    coins: avatarCoins,
    loading: avatarsLoading,
    equipAvatar,
    buyAvatar,
  } = useAvatar();
  const { refreshProfile, coins, session } = useAuth();

  const [banner, setBanner] = useState<{
    visible: boolean;
    message: string;
    type: "warning" | "error" | "success";
  }>({
    visible: false,
    message: "",
    type: "warning",
  });

  const isGuestMode = !session;

  const [availableAvatars, setAvailableAvatars] = useState(DEFAULT_AVATARS);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const { data, error } = await supabase
          .from("avatars")
          .select("id, url, name, price");

        if (error) {
          console.error("Error fetching avatars:", error);
          setAvailableAvatars(DEFAULT_AVATARS);
        } else if (data && data.length > 0) {
          setAvailableAvatars(data);
        } else {
          setAvailableAvatars(DEFAULT_AVATARS);
        }
      } catch (err) {
        console.error("Unexpected error fetching avatars:", err);
        setAvailableAvatars(DEFAULT_AVATARS);
      }
    };

    fetchAvatars();
  }, []);

  useEffect(() => {
    if (currentAvatar) {
      console.log("Avatar equipped:", currentAvatar);
    }
  }, [currentAvatar]);

  // Use the max coins from both sources
  const loading = themesLoading || avatarsLoading;

  const showBanner = (
    message: string,
    type: "warning" | "error" | "success" = "warning",
  ) => {
    setBanner({ visible: true, message, type });
    setTimeout(() => setBanner((prev) => ({ ...prev, visible: false })), 3000);
  };

  // Sort items: Owned first, then by price
  const deckItems = useMemo(() => {
    return Object.values(CARD_THEMES).sort((a, b) => {
      const aOwned = ownedThemes.includes(a.id);
      const bOwned = ownedThemes.includes(b.id);
      if (aOwned && !bOwned) return -1;
      if (!aOwned && bOwned) return 1;
      return a.price - b.price;
    });
  }, [ownedThemes]);

  // Sort avatars: Owned first, then by price
  const avatarItems = useMemo(() => {
    return availableAvatars
      .map((avatar) => ({
        ...avatar,
        imageUrl: avatar.url,
      }))
      .sort((a, b) => {
        const aOwned = ownedAvatars.includes(a.id);
        const bOwned = ownedAvatars.includes(b.id);
        if (aOwned && !bOwned) return -1;
        if (!aOwned && bOwned) return 1;
        return a.price - b.price;
      });
  }, [availableAvatars, ownedAvatars]);

  // Group items into rows of 2 for proper grid layout
  const groupedDeckItems = useMemo(() => {
    const groups = [];
    for (let i = 0; i < deckItems.length; i += 2) {
      groups.push(deckItems.slice(i, i + 2));
    }
    return groups;
  }, [deckItems]);

  const groupedAvatarItems = useMemo(() => {
    const groups = [];
    for (let i = 0; i < avatarItems.length; i += 2) {
      groups.push(avatarItems.slice(i, i + 2));
    }
    return groups;
  }, [avatarItems]);

  // Combine all items for a single FlatList
  const allItems = useMemo(() => {
    return [
      { type: "section-title", key: "decks-title", title: "Decks" },
      ...groupedDeckItems.map((row, index) => ({
        type: "deck-row",
        key: `deck-row-${index}`,
        items: row,
      })),
      { type: "section-title", key: "avatars-title", title: "Avatars" },
      ...groupedAvatarItems.map((row, index) => ({
        type: "avatar-row",
        key: `avatar-row-${index}`,
        items: row,
      })),
    ];
  }, [groupedDeckItems, groupedAvatarItems]);

  const handlePress = async (item: any, type: "deck" | "avatar") => {
    if (isGuestMode) {
      showBanner("Please log in to purchase or equip items", "warning");
      return;
    }

    if (type === "deck") {
      const isOwned = ownedThemes.includes(item.id);
      if (isOwned) {
        await equipTheme(item.id);
      } else {
        try {
          const result = await buyTheme(item.id);
          if (!result.success) {
            showBanner(result.error || "Purchase failed", "error");
          } else {
            showBanner(`Successfully purchased ${item.name}!`, "success");
            // INFO: Easiest fix of my life XD
            await equipTheme(item.id);
            await refreshProfile();
          }
        } catch (e) {
          showBanner("An unexpected error occurred", "error");
        }
      }
    } else if (type === "avatar") {
      const isOwned = ownedAvatars.includes(item.id);
      if (isOwned) {
        const result = await equipAvatar(item.id);
        if (result.success) {
          // IMPORTANT: Refresh auth context to update avatar globally
          await refreshProfile();
          showBanner(`Avatar equipped!`, "success");
        } else {
          showBanner(result.error || "Failed to equip avatar", "error");
        }
      } else {
        try {
          const result = await buyAvatar(item.id, item.price);
          if (!result.success) {
            showBanner(result.error || "Purchase failed", "error");
          } else {
            // IMPORTANT: Refresh auth context to update avatar globally
            await refreshProfile();
            showBanner(`Successfully purchased ${item.name}!`, "success");
          }
        } catch (e) {
          showBanner("An unexpected error occurred", "error");
        }
      }
    }
  };

  const renderDeckItem = ({ item }: { item: any }) => {
    const isOwned = ownedThemes.includes(item.id);
    const isEquipped = currentTheme === item.id;

    return (
      <ThemedView style={[styles.card, isEquipped && styles.equippedCard]}>
        <View style={styles.previewContainer} pointerEvents="none">
          <View
            style={{
              transform: [{ scale: 0.9 }],
              flexDirection: "row",
              gap: 20,
            }}
          >
            <Card themeId={item.id} faceDown={true} disabled={true} />
            <Card
              themeId={item.id}
              faceDown={false}
              disabled={true}
              suit="hearts"
              rank="A"
            />
          </View>
        </View>

        <ThemedText type="defaultSemiBold" style={styles.itemName}>
          {item.name}
        </ThemedText>

        <Pressable
          testID={
            isEquipped
              ? `equipped_button_${item.name}`
              : isOwned
                ? `equip_button_${item.name}`
                : `buy_button_${item.name}`
          }
          onPress={() => handlePress(item, "deck")}
          disabled={isGuestMode}
          style={[
            styles.button,
            isEquipped
              ? styles.equippedBtn
              : isOwned
                ? styles.equipBtn
                : styles.buyBtn,
            { zIndex: 10, elevation: 10 },
            isGuestMode && styles.disabledBtn,
          ]}
        >
          <ThemedText
            style={[
              styles.btnText,
              !isOwned && { color: "black" },
              isGuestMode && styles.disabledBtnText,
            ]}
          >
            {isEquipped
              ? "Equipped"
              : isOwned
                ? "Equip"
                : `${item.price} Coins`}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  };

  const renderAvatarItem = ({ item }: { item: any }) => {
    const isOwned = ownedAvatars.includes(item.id);
    const isEquipped = currentAvatar === item.id;

    return (
      <ThemedView style={[styles.card, isEquipped && styles.equippedCard]}>
        <View style={styles.avatarPreviewContainer}>
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.avatarImage}
            resizeMode="contain"
          />
        </View>

        <ThemedText type="defaultSemiBold" style={styles.itemName}>
          {item.name}
        </ThemedText>

        <Pressable
          testID={
            isEquipped
              ? `equipped_button_${item.name}`
              : isOwned
                ? `equip_button_${item.name}`
                : `buy_button_${item.name}`
          }
          onPress={() => handlePress(item, "avatar")}
          disabled={isGuestMode}
          style={[
            styles.button,
            isEquipped
              ? styles.equippedBtn
              : isOwned
                ? styles.equipBtn
                : styles.buyBtn,
            { zIndex: 10, elevation: 10 },
            isGuestMode && styles.disabledBtn,
          ]}
        >
          <ThemedText
            style={[
              styles.btnText,
              !isOwned && { color: "black" },
              isGuestMode && styles.disabledBtnText,
            ]}
          >
            {isEquipped
              ? "Equipped"
              : isOwned
                ? "Equip"
                : `${item.price} Coins`}
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === "section-title") {
      return (
        <View
          testID={item.key === "decks-title" ? "view_decks" : "view_avatars"}
        >
          <ThemedText
            type="title"
            style={{
              marginLeft: "5%",
              fontSize: 20,
              marginTop: 10,
              marginBottom: 10,
            }}
          >
            {item.title}
          </ThemedText>
        </View>
      );
    }

    if (item.type === "deck-row") {
      return (
        <View style={styles.row}>
          {item.items.map((deckItem: any) => (
            <View key={deckItem.id} style={styles.rowItem}>
              {renderDeckItem({ item: deckItem })}
            </View>
          ))}
        </View>
      );
    }

    if (item.type === "avatar-row") {
      return (
        <View style={styles.row}>
          {item.items.map((avatarItem: any) => (
            <View key={avatarItem.id} style={styles.rowItem}>
              {renderAvatarItem({ item: avatarItem })}
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <ThemedText type="title" style={styles.headerTitle}>
        Shop
      </ThemedText>
      {!isGuestMode && (
        <View style={styles.coinBadge}>
          <ThemedText testID="user_coins" style={styles.coinText}>
            💰 {coins}
          </ThemedText>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={allItems}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
      />

      {banner.visible && (
        <View style={styles.bannerContainer}>
          <AlertBanner
            type={banner.type}
            message={banner.message}
            onClose={() => setBanner((prev) => ({ ...prev, visible: false }))}
          />
        </View>
      )}

      {isGuestMode && (
        <View style={styles.guestBannerContainer}>
          <AlertBanner
            type="info"
            message="Log in to unlock customizations and save your progress!"
            onClose={undefined}
          />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 60,
  },
  headerTitle: { fontSize: 28 },
  coinBadge: {
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  coinText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 16,
  },
  list: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    paddingHorizontal: 10,
  },
  rowItem: {
    flex: 1,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  equippedCard: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  previewContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    overflow: "visible",
  },
  avatarPreviewContainer: {
    height: 100,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  itemName: { textAlign: "center", marginBottom: 10 },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
  },
  equipBtn: { backgroundColor: "#007AFF" },
  equippedBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  buyBtn: { backgroundColor: "#FFD700" },
  btnText: { fontWeight: "bold", fontSize: 12, color: "white" },
  disabledBtn: {
    backgroundColor: "#666666",
    opacity: 0.5,
  },
  disabledBtnText: {
    color: "#999999",
  },
  bannerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  guestBannerContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 99,
  },
});
