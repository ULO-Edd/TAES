import AlertBanner from "@/components/alert-banner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet } from "react-native";

export default function DashboardScreen() {
  const { session, username, avatarUrl, coins } = useAuth();
  const guestAvatar = require("@/assets/images/placeholder.jpg");
  const coinIcon = require("@/assets/images/coin.png");
  const navigation = useNavigation();
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isDeductingCoins, setIsDeductingCoins] = useState(false);
  const [displayCoins, setDisplayCoins] = useState<number | null>(null);

  const handlePracticeGame = () => {
    router.push({ pathname: "/game", params: { mode: "practice" } });
  };

  const handleMatchGame = async () => {
    if (!session) {
      Alert.alert("Login Required", "Please login to play Match Mode!");
      return;
    }

    if (coins === null || coins < 10) {
      Alert.alert(
        "Insufficient Coins",
        "You need 10 coins to enter a match. Play practice mode or earn more coins!",
      );
      return;
    }

    // Show immediate deduction in UI
    setIsDeductingCoins(true);
    setDisplayCoins(coins - 10);

    try {
      console.log("session.user.id:", session.user.id);

      const { data, error } = await supabase.rpc("deduct_coins", {
        uid: session.user.id,
        amount: 10,
      });

      console.log("deduct_coins data:", data);
      console.log("deduct_coins error:", error);

      if (error) {
        console.error("Error deducting coins:", error);
        Alert.alert("Error", "Failed to deduct coins. Please try again.");
        setDisplayCoins(coins); // Revert display
        setIsDeductingCoins(false);
        return;
      }

      // Wait a moment to show the deduction, then navigate
      setTimeout(() => {
        setIsDeductingCoins(false);
        router.push({ pathname: "/game", params: { mode: "match" } });
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
      setDisplayCoins(coins); // Revert display
      setIsDeductingCoins(false);
    }
  };

  useEffect(() => {
    setDisplayCoins(coins);
  }, [coins]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedView style={styles.profileLeft}>
          <Image
            source={!session ? guestAvatar : { uri: avatarUrl }}
            style={styles.avatar}
            testID="user_image"
          />
          <ThemedText style={styles.welcomeText} testID="username_label">
            Welcome, {!session ? "Guest" : username}!
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.headerRight}>
          {!session && (
            <Pressable
              style={styles.loginBtn}
              onPress={() => {
                const rootNav = navigation.getParent
                  ? navigation.getParent()
                  : navigation;
                rootNav?.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "index" }],
                  }),
                );
              }}
              testID="login_button"
            >
              <ThemedText style={styles.loginBtnTxt}>Login</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.contentContainer}>
        <ThemedText style={styles.title} testID="menu_title">
          Main Menu
        </ThemedText>

        <ThemedView style={styles.menuButtonsContainer}>
          {/* Practice Mode Button */}
          <Pressable
            style={styles.practiceButton}
            onPress={handlePracticeGame}
            testID="practice_button"
          >
            <ThemedText style={styles.buttonText}>Practice Mode</ThemedText>
            <ThemedText style={styles.buttonSubtext}>
              Free • Single Game
            </ThemedText>
          </Pressable>

          {/* Match Mode Button */}
          <Pressable
            style={[
              styles.matchButton,
              (!session || coins === null || coins < 10 || isDeductingCoins) &&
                styles.buttonDisabled,
            ]}
            onPress={handleMatchGame}
            disabled={
              !session || coins === null || coins < 10 || isDeductingCoins
            }
            testID="match_button"
          >
            <ThemedView style={styles.matchButtonContent}>
              <ThemedText style={styles.buttonText}>Match Mode</ThemedText>
              <ThemedText style={styles.buttonSubtext}>
                {isDeductingCoins
                  ? "Deducting 10 coins..."
                  : "10 Coins • First to 4 Wins"}
              </ThemedText>
            </ThemedView>
          </Pressable>

          {!session && (
            <ThemedText style={styles.loginHint}>
              Login to play Match Mode!
            </ThemedText>
          )}
        </ThemedView>

        {session ? (
          <ThemedView style={styles.bottomBar}>
            <ThemedView style={styles.balanceContainer}>
              <Image source={coinIcon} style={styles.coinIcon} />
              <ThemedText style={styles.coinsText} testID="coins_label">
                {displayCoins === null
                  ? `Balance: N/A`
                  : `Balance: ${displayCoins}`}
              </ThemedText>
              {isDeductingCoins && (
                <ThemedText style={styles.deductingText}> (-10)</ThemedText>
              )}
            </ThemedView>

            <Pressable
              style={[styles.logoutBtn]}
              onPress={async () => {
                await supabase.auth.signOut();

                const rootNav = navigation.getParent
                  ? navigation.getParent()
                  : navigation;

                rootNav?.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "index" }],
                  }),
                );
              }}
              testID="logout_button"
            >
              <ThemedText style={styles.logoutBtnTxt}>Logout</ThemedText>
            </Pressable>
          </ThemedView>
        ) : isBannerVisible ? (
          <ThemedView style={[styles.alertContainer]}>
            <AlertBanner
              type="warning"
              message="Login to access Match Mode and earn coins!"
              onClose={() => setIsBannerVisible(false)}
            />
          </ThemedView>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  header: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 50,
  },
  menuButtonsContainer: {
    marginTop: 80,
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  practiceButton: {
    backgroundColor: "#0a7ea4",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
  },
  matchButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
  },
  matchButtonContent: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  buttonDisabled: {
    backgroundColor: "#666",
    opacity: 0.5,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonSubtext: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
  loginHint: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
    fontStyle: "italic",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 25,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 5,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  alertContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
  },
  logoutBtn: {
    backgroundColor: "#FF3B30",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  logoutBtnTxt: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  loginBtn: {
    backgroundColor: "#0aa438ff",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  loginBtnTxt: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  coinIcon: {
    width: 25,
    height: 25,
    marginRight: 8,
  },
  deductingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF3B30",
    marginLeft: 5,
  },
});
