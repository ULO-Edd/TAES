import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect, useRef, useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { DatePickerModal } from "react-native-paper-dates";

type MatchRow = {
  id: string;
  match_type: string | null;
  result: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_seconds: number | null;
  entry_fee: number | null;
  total_reward: number | null;
  capote_count: number | null;
  bandeira_count: number | null;
};

type TrickRow = {
  trick?: number;
  winner?: string | null;
  bot_card?: string | null;
  user_card?: string | null;
  bot_card_points?: string | number | null;
  "bot_total_points:"?: string | number | null;
  "user_card_points:"?: string | number | null;
  user_total_points?: string | number | null;
};

type GameRow = {
  id: string;
  match_id?: string;
  game_number: number | null;
  user_points: number | null;
  bot_points: number | null;
  result: string | null;
  capote: boolean | null;
  bandeira: boolean | null;
  tricks: TrickRow[] | null;
  trump?: string | null;
  created_at?: string | null;
  duration_seconds?: number | null;
};

type TurnDetail = TrickRow;

export default function HistoryScreen() {
  const { session } = useAuth();
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [filtered, setFiltered] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultFilter, setResultFilter] = useState<"ALL" | "WIN" | "LOSS">(
    "ALL",
  );
  const [capoteOnly, setCapoteOnly] = useState(false);
  const [bandeiraOnly, setBandeiraOnly] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [orderDesc, setOrderDesc] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFlash, setAppliedFlash] = useState(false);
  const [rangePickerVisible, setRangePickerVisible] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);
  const [matchGames, setMatchGames] = useState<GameRow[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});
  const applyFlashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!session) {
      setMatches([]);
      setFiltered([]);
      setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("matches")
        .select(
          "id, match_type, result, started_at, finished_at, duration_seconds, entry_fee, total_reward, capote_count, bandeira_count",
        )
        .eq("player_id", session.user.id)
        .order("started_at", { ascending: false });

      if (error) {
        setError("Error loading history. Please try again.");
        console.error("Error fetching matches:", error);
      } else {
        const rows = (data ?? []).sort((a, b) => {
          const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
          const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
          return bTime - aTime;
        });
        setMatches(rows);
        setFiltered(rows);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [session?.user.id]);

  useFocusEffect(
    useCallback(() => {
      if (!session) {
        Alert.alert(
          "Guest Access",
          "You can't access history as a guest. Please log in to view it.",
        );
      }
    }, [session]),
  );

  useEffect(() => {
    return () => {
      if (applyFlashTimeout.current) clearTimeout(applyFlashTimeout.current);
    };
  }, []);

  const applyFilters = (
    overrides?: Partial<{
      resultFilter: "ALL" | "WIN" | "LOSS";
      capoteOnly: boolean;
      bandeiraOnly: boolean;
      startDate: string;
      endDate: string;
      orderDesc: boolean;
    }>,
  ) => {
    const filterState = {
      resultFilter,
      capoteOnly,
      bandeiraOnly,
      startDate,
      endDate,
      orderDesc,
      ...overrides,
    };

    let list = [...matches];

    if (filterState.resultFilter !== "ALL") {
      list = list.filter(
        (m) => (m.result || "").toUpperCase() === filterState.resultFilter,
      );
    }

    if (filterState.capoteOnly) {
      list = list.filter((m) => (m.capote_count ?? 0) > 0);
    }

    if (filterState.bandeiraOnly) {
      list = list.filter((m) => (m.bandeira_count ?? 0) > 0);
    }

    const parseDate = (value: string, endOfDay = false) => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return null;
      // Normalize to include the whole day when used as an end date
      if (endOfDay) d.setHours(23, 59, 59, 999);
      else d.setHours(0, 0, 0, 0);
      return d;
    };

    const start = filterState.startDate
      ? parseDate(filterState.startDate)
      : null;
    const end = filterState.endDate ? parseDate(filterState.endDate, true) : null;

    if (start) {
      list = list.filter((m) => {
        if (!m.started_at) return false;
        const d = new Date(m.started_at);
        return d >= start;
      });
    }

    if (end) {
      list = list.filter((m) => {
        if (!m.started_at) return false;
        const d = new Date(m.started_at);
        return d <= end;
      });
    }

    list.sort((a, b) => {
      const aTime = a.started_at ? new Date(a.started_at).getTime() : 0;
      const bTime = b.started_at ? new Date(b.started_at).getTime() : 0;
      return filterState.orderDesc ? bTime - aTime : aTime - bTime;
    });

    setFiltered(list);

    if (applyFlashTimeout.current) clearTimeout(applyFlashTimeout.current);
    setAppliedFlash(true);
    applyFlashTimeout.current = setTimeout(() => setAppliedFlash(false), 650);
  };

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  const handleApplyFilters = () => {
    applyFilters();
    setShowFilters(false);
  };

  const openRangePicker = () => setRangePickerVisible(true);

  const onRangeConfirm = (params: {
    startDate: Date | undefined;
    endDate: Date | undefined;
  }) => {
    const { startDate: start, endDate: end } = params;
    setStartDate(start ? start.toISOString().slice(0, 10) : "");
    setEndDate(end ? end.toISOString().slice(0, 10) : "");
    setRangePickerVisible(false);
  };

  const onRangeDismiss = () => setRangePickerVisible(false);

  const formatRangeLabel = () => {
    if (!startDate && !endDate) return "Select interval";
    const startLabel = startDate ? new Date(startDate).toLocaleDateString() : "Start";
    const endLabel = endDate ? new Date(endDate).toLocaleDateString() : "End ";
    return `${startLabel} — ${endLabel}`;
  };

  const openMatchGames = async (match: MatchRow) => {
    setSelectedMatch(match);
    setShowGamesModal(true);
    setGamesLoading(true);
    setMatchGames([]);
    setGamesError(null);
    setExpandedGames({});

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("match_id", match.id)
      .order("game_number", { ascending: true });

    if (error) {
      console.error("Error fetching games:", error);
      setGamesError("Error loading games. Please try again.");
      setGamesLoading(false);
      return;
    }

    const parsed = (data ?? []).map((row) => ({
      ...(row as GameRow),
      tricks: normalizeTricks((row as GameRow).tricks),
    })) as GameRow[];

    setMatchGames(parsed);
    setGamesLoading(false);
  };

  const closeGameModal = () => {
    setShowGamesModal(false);
    setSelectedMatch(null);
    setMatchGames([]);
    setExpandedGames({});
    setGamesError(null);
  };

  const toggleGameExpansion = (gameId: string) => {
    setExpandedGames((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }));
  };

  const safeDate = (value: string) => {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const formatDate = (value: string | null) => {
    if (!value) return "Unknown date";
    const date = new Date(value);
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds == null) return "—";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  };

  const normalizeTricks = (value: unknown): TrickRow[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((turn, index) => ({
        trick:
          typeof turn?.trick === "number"
            ? turn.trick
            : Number((turn as { trick?: unknown }).trick) || index + 1,
        winner:
          typeof turn?.winner === "string"
            ? turn.winner
            : (turn as { winner?: string | null }).winner ?? null,
        bot_card:
          typeof turn?.bot_card === "string"
            ? turn.bot_card
            : (turn as { bot_card?: string | null }).bot_card ?? null,
        user_card:
          typeof turn?.user_card === "string"
            ? turn.user_card
            : (turn as { user_card?: string | null }).user_card ?? null,
        bot_card_points:
          typeof turn?.bot_card_points === "number" || typeof turn?.bot_card_points === "string"
            ? (turn as { bot_card_points?: string | number }).bot_card_points
            : null,
        "bot_total_points:":
          typeof (turn as { "bot_total_points:"?: unknown })["bot_total_points:"] === "number" ||
          typeof (turn as { "bot_total_points:"?: unknown })["bot_total_points:"] === "string"
            ? (turn as { "bot_total_points:"?: string | number })["bot_total_points:"]
            : null,
        "user_card_points:":
          typeof (turn as { "user_card_points:"?: unknown })["user_card_points:"] === "number" ||
          typeof (turn as { "user_card_points:"?: unknown })["user_card_points:"] === "string"
            ? (turn as { "user_card_points:"?: string | number })["user_card_points:"]
            : null,
        user_total_points:
          typeof turn?.user_total_points === "number" || typeof turn?.user_total_points === "string"
            ? (turn as { user_total_points?: string | number }).user_total_points
            : null,
      }))
      .sort((a, b) => (a.trick ?? 0) - (b.trick ?? 0));
  };

  const formatSuitLabel = (value?: string | null) => {
    if (!value) return "Unknown suit";
    const normalized = value.toLowerCase();
    if (["hearts", "diamonds", "clubs", "spades"].includes(normalized)) {
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    const suitLetter = value.slice(-1).toUpperCase();
    switch (suitLetter) {
      case "H":
        return "Hearts";
      case "D":
        return "Diamonds";
      case "C":
        return "Clubs";
      case "S":
        return "Spades";
      default:
        return "Unknown suit";
    }
  };

  const formatTrumpLabel = (trump?: string | null) => {
    if (!trump) return "—";
    return formatSuitLabel(trump);
  };

  const formatGameDate = (game: GameRow) => {
    const rawDate =
      (game as { played_at?: string | null }).played_at ??
      game.created_at ??
      selectedMatch?.started_at ??
      null;
    if (!rawDate) return "Unknown date";
    const date = new Date(rawDate);
    return isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString();
  };

  const formatGameDuration = (game: GameRow) => {
    if (typeof game.duration_seconds === "number") {
      return formatDuration(game.duration_seconds);
    }
    const trickCount = normalizeTricks(game.tricks).length;
    if (trickCount > 0) return `${trickCount} turns`;
    return "—";
  };

  const renderChip = (
    keyValue: string,
    label: string,
    active: boolean,
    onPress: () => void,
    testID?: string,
  ) => (
    <Pressable
      key={keyValue}
      style={({ pressed }) => [
        styles.chip,
        active && styles.chipActive,
        pressed && styles.chipPressed,
      ]}
      onPress={onPress}
      testID={testID}
    >
      <ThemedText
        style={[styles.chipText, active && styles.chipTextActive]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const renderItem = ({ item }: { item: MatchRow }) => (
    <ThemedView style={styles.card}>
      <View style={styles.row}>
        <View>
          <ThemedText type="defaultSemiBold">
            {item.match_type || "Match"}
          </ThemedText>
          <ThemedText style={styles.date}>
            {formatDate(item.started_at)}
          </ThemedText>
        </View>
        <View style={styles.rightSide}>
          <ThemedText
            style={[
              styles.result,
              {
                color:
                  item.result?.toUpperCase() === "WIN" ? "#4CAF50" : "#FF3B30",
              },
            ]}
          >
            {(item.result || "").toUpperCase() || "—"}
          </ThemedText>
          <ThemedText style={styles.coins}>
            +{item.total_reward ?? 0} Coins
          </ThemedText>
        </View>
      </View>
      <View style={styles.metaRow}>
        <ThemedText style={styles.metaText}>
          Duration: {formatDuration(item.duration_seconds)}
        </ThemedText>
        <ThemedText style={styles.metaText}>
          Entry: {item.entry_fee ?? 0} Coins
        </ThemedText>
      </View>

      <View style={styles.metaRow}>
        <ThemedText style={styles.metaText}>
          Finished at: {formatDate(item.finished_at)}
        </ThemedText>
      </View>

      {(item.capote_count ?? 0) > 0 && (
        <View style={styles.achievementBadge}>
          <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
          <ThemedText style={styles.achievementText}>
            Capote x{item.capote_count}
          </ThemedText>
        </View>
      )}
      {(item.bandeira_count ?? 0) > 0 && (
        <View style={[styles.achievementBadge, styles.bandeiraBadge]}>
          <MaterialCommunityIcons name="flag-checkered" size={14} color="#FFD700" />
          <ThemedText style={styles.achievementText}>
            Bandeira x{item.bandeira_count}
          </ThemedText>
        </View>
      )}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.detailsButtonPressed,
          ]}
          onPress={() => openMatchGames(item)}
          testID={`match_details_${item.id}`}
        >
          <MaterialCommunityIcons name="eye-outline" size={16} color="#fff" />
          <ThemedText style={styles.detailsButtonText}>Details</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container} testID="history_screen">
      <ThemedText
        type="title"
        style={styles.headerTitle}
        testID="history_title"
      >
        Match History
      </ThemedText>
      <View style={styles.filtersCard} testID="filters_card">
        <Pressable
          style={({ pressed }) => [
            styles.filterHeader,
            pressed && styles.filterHeaderPressed,
          ]}
          onPress={() => setShowFilters((prev) => !prev)}
          testID="filters_toggle"
        >
          <ThemedText style={styles.filtersTitle}>Filters</ThemedText>
          <MaterialCommunityIcons
            name={showFilters ? "chevron-up" : "chevron-down"}
            size={20}
            color="#fff"
          />
        </Pressable>

        {showFilters && (
          <>
            <View style={styles.filterGroup}>
              <ThemedText style={styles.groupLabel}>Result</ThemedText>
              <View style={styles.filterRow}>
                {["ALL", "WIN", "LOSS"].map((value) =>
                  renderChip(
                    `result-${value}`,
                    value,
                    resultFilter === value,
                    () => setResultFilter(value as typeof resultFilter),
                    `result_${value.toLowerCase()}_chip`,
                  ),
                )}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Pressable
                style={({ pressed }) => [
                  styles.achievementsHeader,
                  pressed && styles.achievementsHeaderPressed,
                ]}
                onPress={() => setShowAchievements((prev) => !prev)}
              >
                <View style={styles.achievementsLabelRow}>
                  <MaterialCommunityIcons
                    name="trophy"
                    size={16}
                    color="#FFD700"
                  />
                  <ThemedText style={styles.groupLabel}>
                    Achievements
                  </ThemedText>
                </View>
                <MaterialCommunityIcons
                  name={showAchievements ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#fff"
                />
              </Pressable>
              {showAchievements && (
                <View style={styles.filterRow}>
                  {renderChip("achievement-capote", "Capote", capoteOnly, () =>
                    setCapoteOnly((prev) => !prev),
                    "achievement_capote_chip",
                  )}
                  {renderChip(
                    "achievement-bandeira",
                    "Bandeira",
                    bandeiraOnly,
                    () => setBandeiraOnly((prev) => !prev),
                    "achievement_bandeira_chip",
                  )}
                </View>
              )}
            </View>

            <View style={styles.filterGroup}>
              <ThemedText style={styles.groupLabel}>Date range</ThemedText>
              <View style={styles.filterRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.dateButton,
                    pressed && styles.dateButtonPressed,
                  ]}
                  onPress={openRangePicker}
                  testID="date_range_input"
                >
                  <MaterialCommunityIcons
                    name="calendar-range"
                    size={18}
                    color="#fff"
                    style={styles.dateIcon}
                  />
                  <View style={styles.dateButtonTextWrapper}>
                    <ThemedText style={styles.dateButtonLabel}>Date range</ThemedText>
                    <ThemedText
                      style={
                        startDate || endDate
                          ? styles.dateButtonValue
                          : styles.dateButtonPlaceholder
                      }
                    >
                      {formatRangeLabel()}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>

            <View style={styles.filterGroup}>
              <ThemedText style={styles.groupLabel}>Order</ThemedText>
              <View style={styles.filterRow}>
                {renderChip("order-newest", "Newest", orderDesc, () =>
                  setOrderDesc(true),
                  "order_newest_chip",
                )}
                {renderChip("order-oldest", "Oldest", !orderDesc, () =>
                  setOrderDesc(false),
                  "order_oldest_chip",
                )}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                appliedFlash && styles.applyButtonApplied,
                pressed && styles.applyButtonPressed,
              ]}
              onPress={handleApplyFilters}
              testID="apply_filters_button"
            >
              <ThemedText style={styles.applyButtonText}>Apply Filters</ThemedText>
            </Pressable>
            <Pressable
              style={styles.clearButton}
              onPress={() => {
                setResultFilter("ALL");
                setCapoteOnly(false);
                setBandeiraOnly(false);
                setStartDate("");
                setEndDate("");
                setOrderDesc(true);
                applyFilters({
                  resultFilter: "ALL",
                  capoteOnly: false,
                  bandeiraOnly: false,
                  startDate: "",
                  endDate: "",
                  orderDesc: true,
                });
              }}
              testID="clear_filters_button"
            >
              <ThemedText style={styles.clearButtonText}>Clear Filters</ThemedText>
            </Pressable>
          </>
        )}
      </View>

      {!session ? (
        <ThemedText style={styles.centeredText} testID="history_login_prompt">
          Log in to view your history.
        </ThemedText>
      ) : loading ? (
        <ActivityIndicator testID="history_loading_indicator" />
      ) : error ? (
        <ThemedText style={styles.errorText} testID="history_error_text">
          {error}
        </ThemedText>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={null}
          testID="history_list"
        />
      )}
      <Modal
        visible={showGamesModal}
        transparent
        animationType="slide"
        onRequestClose={closeGameModal}
      >
        <View style={styles.modalOverlay} testID="match_games_overlay">
          <View style={styles.modalCard} testID="match_games_modal">
            <View style={styles.modalHeader} testID="match_games_header">
              <ThemedText type="title" testID="match_games_title">Match Games</ThemedText>
            </View>
            {selectedMatch && (
              <ThemedText style={styles.modalSubtitle} testID="match_games_subtitle">
                {formatDate(selectedMatch.started_at)} • {selectedMatch.match_type || "Match"}
              </ThemedText>
            )}
            {gamesLoading ? (
              <ActivityIndicator testID="games_loading_indicator" />
            ) : gamesError ? (
              <ThemedText style={styles.errorText} testID="games_error_text">
                {gamesError}
              </ThemedText>
            ) : (
              <ScrollView
                contentContainerStyle={styles.gamesList}
                testID="match_games_list"
              >
                {matchGames.map((game) => {
                  const turns = normalizeTricks(game.tricks);
                  const isExpanded = !!expandedGames[game.id];
                  return (
                    <View key={game.id} style={styles.gameCard} testID={`game_card_${game.id}`}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.gameHeader,
                          pressed && styles.chipPressed,
                        ]}
                        onPress={() => toggleGameExpansion(game.id)}
                        testID={`game_header_${game.id}`}
                      >
                        <View style={{ flex: 1 }}>
                          <ThemedText type="defaultSemiBold">
                            Game {game.game_number ?? "—"}
                          </ThemedText>
                          <ThemedText style={styles.gameMetaText}>
                            {formatGameDate(game)}
                          </ThemedText>
                          <ThemedText style={styles.gameMetaText}>
                            Duration: {formatGameDuration(game)}
                          </ThemedText>
                        </View>
                        <View style={styles.gameHeaderRight}>
                          <View
                            style={[
                              styles.resultBadge,
                              (game.result || "").toUpperCase() === "WIN"
                                ? styles.resultBadgeWin
                                : styles.resultBadgeLoss,
                            ]}
                            testID={`game_result_badge_${game.id}`}
                          >
                            <ThemedText style={styles.resultBadgeText}>
                              {(game.result || "—").toUpperCase()}
                            </ThemedText>
                          </View>
                          <MaterialCommunityIcons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={18}
                            color="#fff"
                          />
                        </View>
                      </Pressable>
                      <View style={styles.gameInfoRow} testID={`game_info_${game.id}`}>
                        <ThemedText style={styles.gameMetaText}>
                          Score: You {game.user_points ?? 0} — Bot {game.bot_points ?? 0}
                        </ThemedText>
                        <ThemedText style={styles.gameMetaText}>
                          Trump: {formatTrumpLabel(game.trump)}
                        </ThemedText>
                      </View>
                      {(game.capote || game.bandeira) && (
                        <View style={styles.badgeRow} testID={`game_badges_${game.id}`}>
                          {game.capote && (
                            <View style={styles.gameBadge} testID={`game_capote_badge_${game.id}`}>
                              <MaterialCommunityIcons name="trophy" size={14} color="#FFD700" />
                              <ThemedText style={styles.badgeText}>Capote</ThemedText>
                            </View>
                          )}
                          {game.bandeira && (
                            <View
                              style={styles.gameBadge}
                              testID={`game_bandeira_badge_${game.id}`}
                            >
                              <MaterialCommunityIcons name="flag-checkered" size={14} color="#FFD700" />
                              <ThemedText style={styles.badgeText}>Bandeira</ThemedText>
                            </View>
                          )}
                        </View>
                      )}
                      {isExpanded && (
                        <View style={styles.turnList} testID={`game_turns_${game.id}`}>
                          {turns.length === 0 ? (
                            <ThemedText style={styles.centeredText}>
                              No turns recorded.
                            </ThemedText>
                          ) : (
                            turns.map((turn, index) => {
                              const userCardPoints =
                                (turn as { "user_card_points:"?: string | number | null })[
                                  "user_card_points:"
                                ] ?? null;
                              const botCardPoints =
                                (turn as { bot_card_points?: string | number | null })
                                  .bot_card_points ?? null;
                              const userTotalPoints = turn.user_total_points ?? null;
                              const botTotalPoints =
                                (turn as { "bot_total_points:"?: string | number | null })[
                                  "bot_total_points:"
                                ] ?? null;

                              return (
                                <View
                                  key={`${game.id}-turn-${turn.trick ?? index}`}
                                  style={styles.turnCard}
                                  testID={`turn_card_${game.id}_${turn.trick ?? index}`}
                                >
                                  <View style={styles.turnHeader} testID={`turn_header_${game.id}_${turn.trick ?? index}`}>
                                    <ThemedText style={styles.turnTitle}>
                                      Turn {turn.trick ?? index + 1}
                                    </ThemedText>
                                    <View
                                      style={[
                                        styles.winnerBadge,
                                        (turn.winner || "").toLowerCase() === "user"
                                          ? styles.winnerUser
                                          : styles.winnerBot,
                                      ]}
                                      testID={`turn_winner_badge_${game.id}_${turn.trick ?? index}`}
                                    >
                                      <ThemedText style={styles.winnerBadgeText}>
                                        Winner: {turn.winner ?? "—"}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  <View style={styles.turnGrid} testID={`turn_grid_${game.id}_${turn.trick ?? index}`}>
                                    <View style={styles.turnRow} testID={`turn_user_card_row_${game.id}_${turn.trick ?? index}`}>
                                      <ThemedText style={styles.turnLabel}>User card</ThemedText>
                                      <ThemedText style={styles.turnValue}>
                                        {turn.user_card ?? "—"}
                                        {userCardPoints != null
                                          ? ` (+${userCardPoints} pts)`
                                          : ""}
                                      </ThemedText>
                                    </View>
                                    <View style={styles.turnRow} testID={`turn_bot_card_row_${game.id}_${turn.trick ?? index}`}>
                                      <ThemedText style={styles.turnLabel}>Bot card</ThemedText>
                                      <ThemedText style={styles.turnValue}>
                                        {turn.bot_card ?? "—"}
                                        {botCardPoints != null
                                          ? ` (+${botCardPoints} pts)`
                                          : ""}
                                      </ThemedText>
                                    </View>
                                    {(userTotalPoints != null || botTotalPoints != null) && (
                                      <View style={styles.totalsBlock} testID={`turn_totals_${game.id}_${turn.trick ?? index}`}>
                                        <ThemedText style={styles.totalsTitle} testID={`turn_totals_title_${game.id}_${turn.trick ?? index}`}>
                                          Running totals
                                        </ThemedText>
                                        {userTotalPoints != null && (
                                          <View style={styles.totalRow} testID={`turn_user_total_row_${game.id}_${turn.trick ?? index}`}>
                                            <ThemedText style={styles.turnLabel}>
                                              User total
                                            </ThemedText>
                                            <ThemedText style={styles.turnValue}>
                                              {userTotalPoints}
                                            </ThemedText>
                                          </View>
                                        )}
                                        {botTotalPoints != null && (
                                          <View style={styles.totalRow} testID={`turn_bot_total_row_${game.id}_${turn.trick ?? index}`}>
                                            <ThemedText style={styles.turnLabel}>
                                              Bot total
                                            </ThemedText>
                                            <ThemedText style={styles.turnValue}>
                                              {botTotalPoints}
                                            </ThemedText>
                                          </View>
                                        )}
                                      </View>
                                    )}
                                  </View>
                                </View>
                              );
                            })
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.applyButtonPressed,
              ]}
              onPress={closeGameModal}
              testID="close_games_button"
            >
              <ThemedText style={styles.applyButtonText}>Close</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
      <DatePickerModal
        mode="range"
        visible={rangePickerVisible}
        onDismiss={onRangeDismiss}
        startDate={safeDate(startDate)}
        endDate={safeDate(endDate)}
        onConfirm={onRangeConfirm}
        saveLabel="Aplicar"
        closeIcon="close"
        locale="en"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
  headerTitle: { marginBottom: 20, textAlign: "center", marginTop: 50 },
  listContent: { paddingBottom: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontSize: 12, opacity: 0.7, marginTop: 4 },
  rightSide: { alignItems: "flex-end" },
  result: { fontWeight: "bold", fontSize: 16 },
  coins: { fontSize: 12, marginTop: 4 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  metaText: { fontSize: 12, opacity: 0.8 },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  achievementText: {
    color: "#FFD700",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "bold",
  },
  bandeiraBadge: {
    backgroundColor: "rgba(255, 69, 0, 0.12)",
  },
  centeredText: {
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#FF3B30",
    textAlign: "center",
    marginTop: 20,
  },
  filtersCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  filtersTitle: { fontWeight: "bold", marginBottom: 8 },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  filterHeaderPressed: {
    opacity: 0.8,
  },
  filterGroup: { marginBottom: 10 },
  groupLabel: { fontWeight: "600", marginBottom: 6 },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    backgroundColor: "rgba(76,175,80,0.18)", // green tint
    borderColor: "#4CAF50",
  },
  chipPressed: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chipText: { fontSize: 12 },
  chipTextActive: { color: "#4CAF50", fontWeight: "bold" },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    minWidth: 160,
    marginRight: 8,
  },
  dateButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  dateIcon: { marginRight: 10 },
  dateButtonTextWrapper: { flex: 1 },
  dateButtonLabel: { fontSize: 12, opacity: 0.7 },
  dateButtonValue: { fontWeight: "600" },
  dateButtonPlaceholder: { opacity: 0.6 },
  applyButton: {
    marginTop: 4,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonPressed: {
    opacity: 0.85,
  },
  applyButtonApplied: {
    backgroundColor: "#66BB6A",
  },
  applyButtonText: { color: "#fff", fontWeight: "bold" },
  clearButton: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  clearButtonText: { color: "#fff", fontWeight: "bold" },
  achievementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 6,
  },
  achievementsHeaderPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  achievementsLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  detailsButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  detailsButtonText: {
    marginLeft: 6,
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "rgba(24,24,24,0.95)",
    borderRadius: 16,
    padding: 16,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalSubtitle: {
    opacity: 0.8,
    marginBottom: 12,
  },
  gamesList: {
    paddingBottom: 12,
  },
  gameCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  gameHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  gameHeaderRight: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  gameMetaText: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultBadgeWin: {
    backgroundColor: "rgba(76,175,80,0.2)",
  },
  resultBadgeLoss: {
    backgroundColor: "rgba(255,59,48,0.18)",
  },
  resultBadgeText: {
    fontWeight: "bold",
  },
  gameInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  badgeRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  gameBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(255,215,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 8,
  },
  badgeText: {
    color: "#FFD700",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 6,
  },
  turnList: {
    marginTop: 10,
  },
  turnCard: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  turnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  turnTitle: { fontWeight: "600" },
  turnGrid: {
    marginTop: 8,
  },
  turnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  turnLabel: {
    fontSize: 12,
    opacity: 0.75,
  },
  turnValue: {
    fontSize: 12,
    fontWeight: "600",
  },
  totalsBlock: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  totalsTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  winnerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  winnerUser: {
    backgroundColor: "rgba(76,175,80,0.2)",
    borderColor: "rgba(76,175,80,0.45)",
  },
  winnerBot: {
    backgroundColor: "rgba(255,59,48,0.2)",
    borderColor: "rgba(255,59,48,0.45)",
  },
  winnerBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalCloseButton: {
    marginTop: 8,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
});
