import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type LeaderboardItem = {
  uid: string;
  rank: number;
  name: string;
  matches?: number;
  coins?: number;
  achievements?: number;
};

type PersonalStats = {
  matches_played: number;
  wins: number;
  win_rate: number;
  capotes: number;
  bandeiras: number;
  achievements: number;
};

const SkeletonRow = () => (
  <View style={styles.skeletonRow}>
    <View style={styles.skeletonRank} />
    <View style={styles.skeletonName} />
    <View style={styles.skeletonValue} />
  </View>
);

const SkeletonPersonal = () => (
  <View style={styles.statsContainer}>
    <View style={styles.skeletonTitle} />
    {Array.from({ length: 5 }).map((_, i) => (
      <View key={i} style={styles.skeletonPersonalRow}>
        <View style={styles.skeletonPersonalLabel} />
        <View style={styles.skeletonPersonalValue} />
      </View>
    ))}
  </View>
);

const PAGE_SIZE = 10;

export default function ScoreboardScreen() {
  const [tab, setTab] = useState<"personal" | "global">("personal");
  const [globalType, setGlobalType] = useState<
    "matches" | "coins" | "achievements"
  >("matches");
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(
    null,
  );
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(true);
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPersonalStats = async () => {
    setLoadingPersonal(true);

    const { data, error } = await supabase
      .from("personal_stats")
      .select("*")
      .single();

    if (!error && data) {
      setPersonalStats({
        matches_played: data.matches_played,
        wins: data.wins,
        win_rate: data.win_rate,
        capotes: data.capotes,
        bandeiras: data.bandeiras,
        achievements: data.achievements,
      });
    }

    setLoadingPersonal(false);
  };

  const fetchLeaderboard = async (targetPage = 0, reset = false) => {
    const pageToLoad = reset ? 0 : targetPage;
    if (!reset && !hasMore && pageToLoad > page) return;

    if (reset) {
      setHasMore(true);
      setPage(0);
    }
    setLoadingGlobal(true);

    const table =
      globalType === "matches"
        ? "leaderboard_matches_won"
        : globalType === "coins"
          ? "leaderboard_coins_earned"
          : "leaderboard_achievements";

    const orderColumn =
      globalType === "matches"
        ? "matches_won"
        : globalType === "coins"
          ? "coins_earned"
          : "achievements";

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order(orderColumn, { ascending: false })
      .order("username", { ascending: true })
      .range(pageToLoad * PAGE_SIZE, (pageToLoad + 1) * PAGE_SIZE - 1);

    if (error) {
      setLoadingGlobal(false);
      return;
    }

    const hasResults = data && data.length > 0;

    if (hasResults) {
      const newItems = data.map((item, i) => ({
        uid: item.username,
        rank: pageToLoad * PAGE_SIZE + (i + 1),
        name: item.username,
        matches: item.matches_won,
        coins: item.coins_earned,
        achievements: item.achievements,
      }));

      setLeaderboard(newItems);
      setPage(pageToLoad);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setLeaderboard([]);
      setHasMore(false);
    }

    setLoadingGlobal(false);
  };

  useEffect(() => {
    fetchPersonalStats();
  }, []);

  useEffect(() => {
    fetchLeaderboard(0, true);
  }, [globalType]);

  const renderPersonalBests = () =>
    personalStats && (
      <ThemedView style={styles.statsContainer}>
        <ThemedText type="title" style={styles.sectionTitle}>
          Personal Bests
        </ThemedText>

        <View style={styles.statRow} testID="matches_played_row">
          <ThemedText>Matches Played:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {personalStats.matches_played}
          </ThemedText>
        </View>

        <View style={styles.statRow} testID="wins_row">
          <ThemedText>Wins:</ThemedText>
          <ThemedText type="defaultSemiBold">{personalStats.wins}</ThemedText>
        </View>

        <View style={styles.statRow} testID="win_rate_row">
          <ThemedText>Win Rate:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {personalStats.win_rate}%
          </ThemedText>
        </View>

        <View style={styles.statRow} testID="capote_row">
          <ThemedText>Capote Results:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {personalStats.capotes}
          </ThemedText>
        </View>

        <View style={styles.statRow} testID="bandeira_row">
          <ThemedText>Bandeira Results:</ThemedText>
          <ThemedText type="defaultSemiBold">
            {personalStats.bandeiras}
          </ThemedText>
        </View>
      </ThemedView>
    );

  const renderGlobalLeaderboard = () => (
    <ThemedView>
      <ThemedText type="title" style={styles.sectionTitle}>
        Global Rankings
      </ThemedText>

      <View style={styles.globalTabs}>
        <TouchableOpacity
          onPress={() => setGlobalType("matches")}
          testID="matches_won_tab"
        >
          <ThemedText
            style={[
              styles.globalTabText,
              globalType === "matches" && styles.globalTabActive,
            ]}
          >
            Matches Won
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setGlobalType("coins")}
          testID="coins_earned_tab"
        >
          <ThemedText
            style={[
              styles.globalTabText,
              globalType === "coins" && styles.globalTabActive,
            ]}
          >
            Coins Earned
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setGlobalType("achievements")}
          testID="achievements_tab"
        >
          <ThemedText
            style={[
              styles.globalTabText,
              globalType === "achievements" && styles.globalTabActive,
            ]}
          >
            Achievements
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={styles.tableHeader}>
        <ThemedText style={styles.headerText}>Rank</ThemedText>
        <ThemedText style={styles.headerText}>Player</ThemedText>
        <ThemedText style={styles.headerText}>
          {globalType === "matches"
            ? "Matches"
            : globalType === "coins"
              ? "Coins"
              : "Achievements"}
        </ThemedText>
      </View>

      {loadingGlobal ? (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </>
      ) : (
        <Animated.View entering={FadeIn.duration(300)}>
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.uid}
            testID="global_leaderboard_list"
            renderItem={({ item }) => (
              <ThemedView
                style={styles.row}
                testID={`leaderboard_row_${item.rank}`}
              >
                <ThemedText style={styles.rank}>#{item.rank}</ThemedText>

                <View style={styles.userInfo}>
                  <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                </View>

                <ThemedText style={styles.coins}>
                  {globalType === "matches"
                    ? item.matches
                    : globalType === "coins"
                      ? item.coins
                      : item.achievements}
                </ThemedText>
              </ThemedView>
            )}
          />
        </Animated.View>
      )}
      {!loadingGlobal && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => fetchLeaderboard(page - 1)}
            disabled={page === 0 || loadingGlobal}
            style={[
              styles.pageButton,
              (page === 0 || loadingGlobal) && styles.pageButtonDisabled,
            ]}
          >
            <ThemedText style={styles.pageButtonText}>Previous</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.pageInfo}>Page {page + 1}</ThemedText>

          <TouchableOpacity
            onPress={() => fetchLeaderboard(page + 1)}
            disabled={!hasMore || loadingGlobal}
            style={[
              styles.pageButton,
              (!hasMore || loadingGlobal) && styles.pageButtonDisabled,
            ]}
          >
            <ThemedText style={styles.pageButtonText}>Next</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.headerTitle}>
        Scoreboards
      </ThemedText>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setTab("personal")}
          style={tab === "personal" && styles.tabActive}
          testID="personal_bests_tab"
        >
          <ThemedText style={tab === "personal" && styles.tabTextActive}>
            Personal Bests
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("global")}
          style={tab === "global" && styles.tabActive}
          testID="global_rankings_tab"
        >
          <ThemedText style={tab === "global" && styles.tabTextActive}>
            Global Rankings
          </ThemedText>
        </TouchableOpacity>
      </View>

      {tab === "personal" ? (
        loadingPersonal ? (
          <SkeletonPersonal />
        ) : (
          renderPersonalBests()
        )
      ) : (
        renderGlobalLeaderboard()
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  headerTitle: { marginBottom: 20, textAlign: "center", marginTop: 50 },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 20,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  skeletonRank: {
    width: 40,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
  },
  skeletonName: {
    flex: 1,
    height: 18,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
  },
  skeletonValue: {
    width: 50,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 22,
    width: 140,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 6,
    alignSelf: "center",
    marginBottom: 20,
  },
  skeletonPersonalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  skeletonPersonalLabel: {
    width: 120,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 4,
  },
  skeletonPersonalValue: {
    width: 60,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 4,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
    paddingBottom: 4,
  },
  tabTextActive: {
    color: "#FFD700",
    fontWeight: "bold",
  },
  sectionTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 18,
  },
  statsContainer: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  globalTabs: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 10,
  },
  globalTabText: {
    fontSize: 14,
    opacity: 0.7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  globalTabActive: {
    color: "#FFD700",
    fontWeight: "bold",
    opacity: 1,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
    marginBottom: 10,
  },
  headerText: { opacity: 0.6, fontSize: 12, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  rank: { width: 40, fontWeight: "bold", fontSize: 16, color: "#FFD700" },
  userInfo: { flex: 1 },
  subtext: { fontSize: 12, opacity: 0.6 },
  coins: { fontWeight: "bold" },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 8,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonText: {
    fontWeight: "bold",
  },
  pageInfo: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    fontSize: 12,
    fontWeight: "bold",
  },
});
