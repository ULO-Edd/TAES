import { Card } from '@/components/card';
import { ThemedText } from "@/components/themed-text";
import { FlowingNoiseBackground } from '@/components/ui/flowing-noise-background';
import { SimpleBot } from '@/game/bot';
import { Card as CardType } from '@/game/deck';
import { GameModeManager, GameResult } from '@/game/game-mode-manager';
import { useAuth } from '@/hooks/use-auth';
import { useGameTheme } from "@/hooks/use-game-theme";
import { supabase } from '@/lib/supabase';
import { useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';


export default function GameScreen() {
    const params = useLocalSearchParams();
    const mode = (params.mode as 'practice' | 'match') || 'practice';
    const { session, avatarUrl, coins } = useAuth();
    const [currentCoins, setCurrentCoins] = useState(coins);
    const [gameManager] = useState(() => new GameModeManager());
    const [state, setState] = useState<any>(null);
    const [message, setMessage] = useState('Starting game...');
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [showGameResult, setShowGameResult] = useState(false);
    const [gameResult, setGameResult] = useState<GameResult | null>(null);
    const [showMatchResult, setShowMatchResult] = useState(false);
    const isProcessingRef = useRef(false);
    const coinIcon = require("@/assets/images/coin.png");

    const [isBalatro, setIsBalatro] = useState(false);
    const [cheatCodeBuffer, setCheatCodeBuffer] = useState('');
    const player = useAudioPlayer('https://openwheels.racing/files/music/561728412541.mp3');

    const [canUndo, setCanUndo] = useState(false);
    const [showUndoConfirm, setShowUndoConfirm] = useState(false);
    const [playerHasPlayed, setPlayerHasPlayed] = useState(false);
    const [showUndoInfo, setShowUndoInfo] = useState(false);

    const playerCardAnim = useRef(new Animated.ValueXY({ x: 0, y: 100 })).current;
    const botCardAnim = useRef(new Animated.ValueXY({ x: 0, y: -100 })).current;
    const playerCardOpacity = useRef(new Animated.Value(0)).current;
    const botCardOpacity = useRef(new Animated.Value(0)).current;

    const [visualTable, setVisualTable] = useState<any[]>([]);
    const { currentTheme } = useGameTheme();

    useEffect(() => {
        if (cheatCodeBuffer.toLowerCase().endsWith('balatro')) {
            activateBalatroMode();
            setCheatCodeBuffer('');
        }
    }, [cheatCodeBuffer]);

    useEffect(() => {
        setCurrentCoins(coins);
    }, [coins]);

    const hiddenInputRef = useRef<TextInput>(null);

    const activateBalatroMode = () => {
        if (isBalatro) return;

        setIsBalatro(true);
        setMessage('🃏 JIMBO SUMMONED! 🃏');

        player.loop = true;
        player.volume = 1.0;
        player.play();
    };

    const botAvatar = useMemo(() => {
        const botProfilePic = [
            require('@/assets/avatars/blue_bot.png'),
            require('@/assets/avatars/green_bot.png'),
            require('@/assets/avatars/purple_bot.png'),
            require('@/assets/avatars/orange_bot.png'),
        ];

        const randomInt = Math.floor(Math.random() * botProfilePic.length);
        return botProfilePic[randomInt];
    }, []);    // Visual state for cards on table

    useEffect(() => {
        // Initialize game with mode
        gameManager.startNewGame(mode, [
            { id: 'player', name: 'You' },
            { id: 'bot', name: 'Bot' },
        ]);
        updateState();
        setMessage('Your turn! Select a card to play');
        setIsPlayerTurn(true);
    }, []);

    const confirmUndo = async () => {
        setShowUndoConfirm(false);
        const game = gameManager.getCurrentGame();
        if (!game) return;

        const undoCost = game.getUndoCost();

        // Deduct coins in match mode
        if (mode === 'match' && session) {
            try {
                // Optimistically update UI
                setCurrentCoins(prev => prev - undoCost);

                const { error } = await supabase
                    .from('profiles')
                    .update({ coins: currentCoins - undoCost })
                    .eq('id', session.user.id);

                if (error) {
                    console.error('Error deducting coins:', error);
                    setMessage('Failed to deduct coins');
                    setCurrentCoins(coins); // Revert
                    return;
                }
            } catch (error) {
                console.error('Error in undo transaction:', error);
                setCurrentCoins(coins); // Revert
                return;
            }
        }

        // Perform the undo - undoes back to player's last action
        const success = game.undoToLastPlayerAction('player'); // CHANGED

        if (success) {
            setVisualTable([]);
            playerCardOpacity.setValue(0);
            botCardOpacity.setValue(0);
            isProcessingRef.current = false;
            setPlayerHasPlayed(false); // RESET

            updateState();

            const costMsg = mode === 'match' ? ` (-${undoCost} coins)` : '';
            const remainingMsg = mode === 'match' ? ` [${game.getRemainingUndos()} left]` : '';

            // Always player's turn after undo
            setMessage(`Move undone! Your turn!`);
            setIsPlayerTurn(true);
        } else {
            setMessage('Failed to undo move');
            if (mode === 'match') {
                setCurrentCoins(coins);
            }
        }
    };

    const sortHand = (hand: CardType[]) => {
        const suitOrder = { 'spades': 1, 'hearts': 2, 'clubs': 3, 'diamonds': 4 };

        // INFO:Rank value for sorting (A=11, 7=10, K=4, J=3, Q=2, others=0)
        const getRankValue = (rank: string) => {
            const values = { 'A': 11, '7': 10, 'K': 4, 'J': 3, 'Q': 2 };
            return values[rank] || 0;
        };

        return [...hand].sort((a, b) => {
            if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                return suitOrder[a.suit] - suitOrder[b.suit];
            }
            return getRankValue(b.rank) - getRankValue(a.rank);
        });
    };

    const updateState = () => {
        const game = gameManager.getCurrentGame();
        if (!game) return;

        const gameOver = gameManager.isGameOver();

        // Check if undo is available - player must have played AND have undos remaining
        const canUndoNow = game.canUndoForPlayer('player') &&
            !gameOver &&
            (mode === 'practice' || game.hasUndosRemaining());

        setCanUndo(canUndoNow);

        const newState = {
            deck: game.deck,
            deckSize: game.deck.length,
            table: game.table,
            trump: game.trumpCard,
            isGameOver: gameOver,
            players: game.players.map(p => ({
                id: p.id,
                name: p.name,
                points: p.points,
                hand: p.id === 'player' ? sortHand(p.hand) : p.hand,
            })),
        };
        setState(newState);

        if (gameOver && !showGameResult) {
            handleGameOver();
        }
    };

    const handleGameOver = () => {
        const result = gameManager.evaluateGameResult();
        if (!result) return;

        setGameResult(result);
        setShowGameResult(true);
        setIsPlayerTurn(false);


        if (isPractice) return;

        // Check if match is over
        if (gameManager.isMatchOver()) {
            setTimeout(() => {
                setShowGameResult(false);
                setShowMatchResult(true);

                // Award coins in match mode
                if (mode === 'match' && session) {
                    awardCoins();
                }
            }, 3000);
        }
    };

    const awardCoins = async () => {
        const gameState = gameManager.getGameModeState();
        const coinsEarned = gameState.coinsEarned;

        if (coinsEarned > 0 && session) {
            try {
                // Fetch current coins
                const { data: profile, error: fetchError } = await supabase
                    .from('profiles')
                    .select('coins')
                    .eq('id', session.user.id)
                    .single();

                if (fetchError) {
                    console.error('Error fetching profile:', fetchError);
                    return;
                }

                // Update coins
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ coins: (profile?.coins || 0) + coinsEarned })
                    .eq('id', session.user.id);

                if (updateError) {
                    console.error('Error updating coins:', updateError);
                }
            } catch (error) {
                console.error('Error awarding coins:', error);
            }
        }
    };

    const handleNextGame = () => {
        setShowGameResult(false);
        setGameResult(null);
        gameManager.startNextGame();
        updateState();
        setMessage('Your turn! Select a card to play');
        setIsPlayerTurn(true);
        setPlayerHasPlayed(false);
        setVisualTable([]);
        playerCardOpacity.setValue(0);
        botCardOpacity.setValue(0);
        isProcessingRef.current = false;
    };

    const handleBackToDashboard = () => {

        /* INFO: Poema do Fernando sobre Go
         *
         * Dizem que o Fernando só fala em goroutines,
         * que sonha com channels e acorda aos saltinhos.
         * Enquanto o resto da malta ainda está a acordar,
         * ele já fez três microservices… só para se “aquecer” a programar.
         *
         * Com o seu Go tão elegante — diz ele, “é minimalista!”,
         * mas depois passa o dia inteiro a discutir com o linter na lista.
         * Jura que os panics “são raros, pá, quase nunca dão”…
         * mas o servidor treme sempre que ele faz deploy à segunda mão.
         *
         * “Go é simples!”, insiste, de peito cheio e convicção —
         * e lá vai o Fernando explicar interfaces… pela oitava vez no verão.
         * Nós ouvimos, claro, é sempre bonito de ver…
         * como ele fala do Go com brilho nos olhos — 「まるで恋」 (marude koi), quase um amor a acontecer.
         *
         * E no fim do dia, quando o café já acabou,
         * lá está ele a sorrir:
         * “Malta, isto compila!
         * Eu bem vos disse — Go é o melhor que já se inventou!”
         *
         * Mas a verdade, meus amigos — e digo isto sem maldade —
         * é que o Fernando ama o Go…
         * porque o Go não o obriga a pensar demasiado.
         */
        if (player.playing) player.pause();
        router.replace('/(tabs)');
    };

    const playBotTurn = async () => {
        const game = gameManager.getCurrentGame();
        if (!game) return;

        try {
            setMessage('Bot is thinking...');
            const botPlayer = game.players.find(p => p.id === 'bot');
            const bot = new SimpleBot();

            if (botPlayer) {
                const botCard = bot.selectCard(botPlayer.hand, game.trumpCard!.suit, game.table.map(t => t.card));
                const botPlay = { player: { id: 'bot', name: 'Bot' }, card: botCard };

                // Show bot card
                setVisualTable([botPlay]);
                setMessage(`Bot played ${botCard.rank} of ${botCard.suit}`);

                // Animate bot card
                botCardAnim.setValue({ x: 0, y: -100 });
                botCardOpacity.setValue(0);
                Animated.parallel([
                    Animated.spring(botCardAnim, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                        tension: 50,
                        friction: 7
                    }),
                    Animated.timing(botCardOpacity, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: true
                    })
                ]).start();

                await new Promise(resolve => setTimeout(resolve, 500));
                game.playCard(botPlayer, botCard);
                updateState();

                setMessage('Your turn! Select a card to play');
                setIsPlayerTurn(true);
            }

            isProcessingRef.current = false;
        } catch (error) {
            console.error('ERROR in bot turn:', error);
            setVisualTable([]);
            isProcessingRef.current = false;
            setIsPlayerTurn(true);
        }
    };

    const handleCardPlay = async (card: CardType) => {
        if (!isPlayerTurn || showGameResult || showMatchResult || isProcessingRef.current) {
            return;
        }

        isProcessingRef.current = true;
        setIsPlayerTurn(false);
        setPlayerHasPlayed(true);

        const game = gameManager.getCurrentGame();
        if (!game) return;

        const playerPlay = { player: { id: 'player', name: 'You' }, card };

        setVisualTable(prev => [...prev, playerPlay]);

        setMessage(`You played ${card.rank} of ${card.suit}`);

        playerCardAnim.setValue({ x: 0, y: 100 });
        playerCardOpacity.setValue(0);

        if (visualTable.length === 0) {
            // Player is Leading (First card) -> Offset slightly to the RIGHT (30)
            Animated.parallel([
                Animated.spring(playerCardAnim, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                }),
                Animated.timing(playerCardOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        } else {
            // Player is Responding (Second card) -> Offset slightly to the LEFT (-30)
            Animated.parallel([
                Animated.spring(playerCardAnim, {
                    toValue: { x: 0, y: 0 },
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7
                }),
                Animated.timing(playerCardOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                })
            ]).start();
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const player = game.players.find(p => p.id === 'player');
            if (player) {
                game.playCard(player, card);
                updateState();
            }
        } catch (error) {
            console.error('ERROR playing card:', error);
            setMessage('Error: ' + (error as Error).message);
            isProcessingRef.current = false;
            setIsPlayerTurn(true);
            return;
        }

        const isRoundOver = game.table.length >= 2;

        if (!isRoundOver) {
            setTimeout(async () => {
                try {
                    setMessage('Bot is thinking...');
                    const botPlayer = game.players.find(p => p.id === 'bot');
                    const bot = new SimpleBot();

                    if (botPlayer) {
                        const botCard = bot.selectCard(botPlayer.hand, game.trumpCard!.suit, game.table.map(t => t.card));
                        const botPlay = { player: { id: 'bot', name: 'Bot' }, card: botCard };

                        // Add Bot card to visual table
                        setVisualTable(prev => [...prev, botPlay]);
                        setMessage(`Bot played ${botCard.rank} of ${botCard.suit}`);

                        // Animate Bot card
                        botCardAnim.setValue({ x: 0, y: -100 });
                        botCardOpacity.setValue(0);
                        Animated.parallel([
                            Animated.spring(botCardAnim, {
                                toValue: { x: 0, y: 0 },
                                useNativeDriver: true,
                                tension: 50,
                                friction: 7
                            }),
                            Animated.timing(botCardOpacity, {
                                toValue: 1,
                                duration: 300,
                                useNativeDriver: true
                            })
                        ]).start();

                        await new Promise(resolve => setTimeout(resolve, 500));

                        game.playCard(botPlayer, botCard);
                        updateState();

                        finishRoundAndCleanup(game);
                    }
                } catch (error) {
                    console.error('ERROR in bot play:', error);
                    isProcessingRef.current = false;
                    setIsPlayerTurn(true);
                }
            }, 1000);
        } else {
            setTimeout(() => {
                finishRoundAndCleanup(game);
            }, 500); // Short delay to let player see their card
        }
    };

    const handleUndo = async () => {
        const game = gameManager.getCurrentGame();
        if (!game || !game.canUndoForPlayer('player')) { // CHANGED
            setMessage('No moves to undo!');
            return;
        }

        const undoCost = game.getUndoCost();
        if (mode === 'match') {
            if (!session) {
                setMessage('Must be logged in to undo in match mode');
                return;
            }

            if (currentCoins < undoCost) { // CHANGED to currentCoins
                setMessage(`Insufficient coins! Need ${undoCost} coins to undo.`);
                return;
            }

            // ADD THIS CHECK
            if (!game.hasUndosRemaining()) {
                setMessage(`Undo limit reached! (${game.getUndoCount()} used)`);
                return;
            }
        }

        setShowUndoConfirm(true);
    };

    const finishRoundAndCleanup = (game: any) => {
        if (game.manualEvaluateRound) {
            game.manualEvaluateRound();
        }
        updateState();

        setTimeout(() => {
            Animated.parallel([
                Animated.timing(playerCardOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true
                }),
                Animated.timing(botCardOpacity, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true
                })
            ]).start(() => {
                setVisualTable([]); // Clear table
                updateState();

                if (!gameManager.isGameOver()) {
                    const currentPlayer = game.currentPlayer;

                    if (currentPlayer.id === 'bot') {
                        setMessage('Bot won the round! Bot plays first...');
                        setPlayerHasPlayed(false);
                        setTimeout(() => {
                            playBotTurn();
                        }, 800);
                    } else {
                        setMessage('You won the round! Your turn to play first...');
                        setPlayerHasPlayed(false);
                        setIsPlayerTurn(true);
                    }
                }
                isProcessingRef.current = false;
            });
        }, 700);
    };

    if (!state) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading game...</Text>
            </View>
        );
    }

    const playerData = state.players?.find((p: any) => p.id === 'player');
    const botData = state.players?.find((p: any) => p.id === 'bot');
    const gameState = gameManager.getGameModeState();
    const isPractice = mode === 'practice';

    let displayBotWins = gameState.botGamesWon;
    let displayPlayerWins = gameState.playerGamesWon;

    if (showGameResult || showMatchResult) {
        if (gameResult?.winner.id === 'bot') {
            displayBotWins = Math.max(0, displayBotWins - 1);
            // INFO: If they won via Capote (2 pts), we might need to subtract 2
            if (gameResult.capote) displayBotWins = Math.max(0, displayBotWins - 1);
        }
        if (gameResult?.winner.id === 'player') {
            displayPlayerWins = Math.max(0, displayPlayerWins - 1);
            if (gameResult.capote) displayPlayerWins = Math.max(0, displayPlayerWins - 1);
        }
    }

    return (
        <View style={styles.container}>
            <FlowingNoiseBackground isBalatroMode={isBalatro} />

            <TextInput
                ref={hiddenInputRef}
                style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus={false}
                onChangeText={(text) => {
                    // Simple buffer append
                    setCheatCodeBuffer(prev => (prev + text).slice(-10));
                }}
            />

            {/* Header - Match Score or Practice Mode */}
            <View style={styles.header}>
                <View style={styles.scoreCard}>
                    <Text testID="bot_username" style={styles.scoreLabel}>Bot</Text>
                    <Image
                        source={botAvatar}
                        style={styles.avatar}
                        testID="bot_image"
                    />

                    {!isPractice && (
                        <Text style={styles.matchScore}>{displayBotWins}/4</Text>
                    )}
                    <Text testID='opponent-points' style={styles.scoreValue}>{botData?.points || 0} pts</Text>
                </View>

                <View style={styles.deckInfo} testID='deck-info'>
                    {isPractice && (
                        <Text style={styles.practiceLabel}>Practice</Text>
                    )}
                    <Text style={styles.deckCount}>{state.deckSize || 0}</Text>
                    <Text style={styles.deckLabel}>cards left</Text>
                </View>

                <View style={styles.scoreCard}>
                    <Text testID="user_username" style={styles.scoreLabel}>You</Text>
                    <Pressable
                        onPress={() => hiddenInputRef.current?.focus()}
                        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                    >
                        <Image
                            source={avatarUrl ? { uri: avatarUrl } : require('@/assets/images/placeholder.jpg')}
                            style={styles.avatar}
                            testID="user_image"
                        />
                    </Pressable>
                    {!isPractice && (
                        <Text style={styles.matchScore}>{displayPlayerWins}/4</Text>
                    )}
                    <Text testID='player-points' style={styles.scoreValue}>{playerData?.points || 0} pts</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'center' }}>
                        <Image source={coinIcon} style={styles.coinIcon} />
                        <ThemedText testID="user_coins" style={styles.coinsValue}>{currentCoins}</ThemedText>
                    </View>
                </View>
            </View>

            {/* Opponent's Hand */}
            <View style={styles.opponentHandContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.opponentHand}
                    testID='opponent-hand-scroll'
                >
                    {botData?.hand?.map((_: any, i: number) => {
                        const stackStyle = {
                            marginLeft: i === 0 ? 0 : -45,
                            zIndex: i,
                            elevation: i,
                        };

                        return (
                            <View
                                key={i}
                                style={[styles.opponentCardWrapper, stackStyle]}
                            >
                                <Card faceDown style={styles.opponentCard} themeId={currentTheme} />
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Playing Field */}
            <View style={styles.playingField}>
                {/* Trump Card */}
                {state.trump && (
                    // IMPORTANT
                    <View style={styles.trumpContainer} testID='trump-card'>
                        <Text style={styles.trumpLabel}>Trump</Text>
                        <Card
                            suit={state.trump.suit}
                            rank={state.trump.rank}
                            themeId={currentTheme}
                            style={styles.trumpCard}
                            disabled
                        />
                    </View>
                )}

                {/* Table Cards */}
                <View style={styles.tableMat}>

                    <View testID='table-view' style={styles.tableCards}>
                        {visualTable.map((play: any, i: number) => {
                            const isPlayer = play.player.id === 'player';
                            const rotation = i === 0 ? '-6deg' : '6deg'; // Visual rotation for stack effect

                            const animStyle = {
                                transform: [
                                    { translateX: isPlayer ? playerCardAnim.x : botCardAnim.x },
                                    { translateY: isPlayer ? playerCardAnim.y : botCardAnim.y },
                                    { rotate: rotation }
                                ],
                                opacity: isPlayer ? playerCardOpacity : botCardOpacity,
                                width: 70,
                                height: 100,
                                zIndex: i,
                            };

                            return (
                                <View key={i} style={styles.tableCardContainer}>
                                    <Card
                                        suit={play.card.suit}
                                        rank={play.card.rank}
                                        style={[styles.tableCard, animStyle]}
                                        themeId={currentTheme}
                                        disabled
                                        animated
                                    />
                                </View>
                            );
                        })}
                    </View>
                </View>

            </View>

            {/* Message */}
            <View style={styles.messageContainer}>
                <Text style={styles.message}>{message}</Text>
            </View>

            {/* Undo Button */}
            <Pressable
                style={[
                    styles.undoButton,
                    (!canUndo || showGameResult || showMatchResult) && styles.undoButtonDisabled
                ]}
                onPress={handleUndo}
                onLongPress={() => mode === 'match' && setShowUndoInfo(true)} // ADD THIS
                disabled={!canUndo || showGameResult || showMatchResult}
                testID="undo-button"
            >
                <Text style={styles.undoButtonText}>↶</Text>
                {mode === 'match' && canUndo && (
                    <View style={styles.undoCost}>
                        <Image source={coinIcon} style={{ width: 12, height: 12, marginRight: 2 }} />
                        <Text style={styles.undoCostText}>
                            {gameManager.getCurrentGame()?.getUndoCost()}
                        </Text>
                    </View>
                )}
            </Pressable>

            {/* Undo Info Panel (Match Mode) */}
            {mode === 'match' && (
                <Modal visible={showUndoInfo} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent} testID="undo-info-modal">
                            <Text style={styles.modalTitle}>Undo Information</Text>
                            <View style={styles.undoInfoContent}>
                                <Text style={styles.undoInfoText}>
                                    Undos Used: {gameManager.getCurrentGame()?.getUndoCount() || 0} / {gameManager.getCurrentGame()?.getMaxUndo() || 5}
                                </Text>
                                <Text style={styles.undoInfoText}>
                                    Remaining: {gameManager.getCurrentGame()?.getRemainingUndos() || 5}
                                </Text>
                                <Text style={styles.undoInfoText}>
                                    Cost per Undo: {gameManager.getCurrentGame()?.getUndoCost() || 10} coins
                                </Text>
                                <Text style={styles.undoInfoSubtext}>
                                    Undo reverts back to your last play
                                </Text>
                            </View>
                            <Pressable
                                style={styles.modalButton}
                                onPress={() => setShowUndoInfo(false)}
                                testID="undo-info-close"
                            >
                                <Text style={styles.modalButtonText}>Close</Text>
                            </Pressable>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Undo Confirmation Modal */}
            <Modal visible={showUndoConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent} testID="undo-confirm-modal">
                        <Text style={styles.modalTitle}>Undo Last Move?</Text>
                        {mode === 'match' && (
                            <>
                                <Text style={styles.modalSubtext}>
                                    This will cost {gameManager.getCurrentGame()?.getUndoCost()} coins
                                </Text>
                                <Text style={styles.modalSubtext}>
                                    Remaining undos: {gameManager.getCurrentGame()?.getRemainingUndos()}
                                </Text>
                            </>
                        )}
                        <View style={{ flexDirection: 'row', gap: 15, marginTop: 20 }}>
                            <Pressable
                                style={[styles.modalButton, { backgroundColor: '#888' }]}
                                onPress={() => setShowUndoConfirm(false)}
                                testID="undo-cancel-button"
                            >
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={styles.modalButton}
                                onPress={confirmUndo}
                                testID="undo-confirm-button"
                            >
                                <Text style={styles.modalButtonText}>Undo</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Player's Hand */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.playerHand}
                style={[
                    styles.playerHandScroll,
                    { paddingRight: 40 }
                ]}
                testID='player-hand-scroll'
            >
                {playerData?.hand?.map((card: CardType, i: number) => {
                    const isTheTrumpCard = state.trump &&
                        card.suit === state.trump.suit &&
                        card.rank === state.trump.rank;

                    const isRestrictedTrump = isTheTrumpCard && playerData.hand.length > 1;

                    const isDisabled = !isPlayerTurn ||
                        showGameResult ||
                        showMatchResult;

                    const stackStyle = {
                        marginLeft: i === 0 ? 0 : -40,
                        zIndex: i,
                        elevation: i,
                    };

                    return (
                        <View
                            key={`${card.suit}-${card.rank}-${i}`}
                            style={[
                                styles.playerCardWrapper,
                                stackStyle,
                                isRestrictedTrump && { opacity: 0.5 }
                            ]}
                        >
                            <Card
                                suit={card.suit}
                                rank={card.rank}
                                onPress={() => handleCardPlay(card)}
                                disabled={isDisabled}
                                themeId={currentTheme}
                                style={[
                                    styles.playerCard,
                                    isDisabled && styles.playerCardDisabled
                                ]}
                            />
                        </View>
                    );
                })}
            </ScrollView>

            {/* Game Result Modal */}
            <Modal visible={showGameResult} transparent animationType="fade" statusBarTranslucent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent} testID='game-result-modal'>
                        <Text style={styles.modalTitle}>
                            {gameResult?.winner.id === 'player' ? '🎉 You Won!' : '😔 Bot Won!'}
                        </Text>
                        <Text style={styles.modalScore}>
                            {gameResult?.winnerPoints} - {gameResult?.loserPoints}
                        </Text>
                        {!isPractice && gameResult?.capote && (
                            <Text style={styles.achievement} testID='current-match-capote' >⭐ CAPOTE! (+2 Won Games)</Text>
                        )}
                        {!isPractice && gameResult?.bandeira && (
                            <Text style={styles.achievement} testID='current-match-bandeira' >🏆 BANDEIRA! (Instant Win)</Text>
                        )}
                        {!isPractice && (
                            <Text style={styles.modalSubtext} testID='current-match-score'>
                                Match Score: {gameState.playerGamesWon} - {gameState.botGamesWon}
                            </Text>
                        )}
                        {!gameManager.isMatchOver() && !isPractice && (
                            <Pressable style={styles.modalButton} onPress={handleNextGame} testID='next-game-button'>
                                <Text style={styles.modalButtonText}>Next Game</Text>
                            </Pressable>
                        )}
                        {isPractice && (
                            <Pressable style={styles.modalButton} onPress={handleBackToDashboard} testID='back-to-menu-button'>
                                <Text style={styles.modalButtonText}>Back to Menu</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Match Result Modal */}
            <Modal visible={showMatchResult} transparent animationType="fade" statusBarTranslucent={true}>
                <View style={styles.modalOverlay} testID='match-result-modal'>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {gameState.matchWinner === 'player' ? '🏆 Match Won!' : '😢 Match Lost!'}
                        </Text>

                        <Text style={styles.modalScore} testID='final-match-score'>
                            Final: {gameState.playerGamesWon} - {gameState.botGamesWon}
                        </Text>

                        <Text style={styles.coinsEarned} testID='coins-earned'>
                            💰 Coins Earned: {gameState.coinsEarned}
                        </Text>
                        <Pressable style={styles.modalButton} onPress={handleBackToDashboard} testID='back-to-dashboard-button'>
                            <Text style={styles.modalButtonText}>Back to Menu</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#333333',
        padding: 10,
    },
    loadingText: {
        color: '#fff',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 28,
        paddingVertical: 15,
        paddingHorizontal: 10,
    },
    scoreCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 15,
        minWidth: 100,
        alignItems: 'center',
    },
    scoreLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    matchScore: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 2,
    },
    scoreValue: {
        color: '#AAA',
        fontSize: 16,
        marginTop: 2,
    },
    coinsValue: {
        color: '#FFD700',
        fontSize: 14,
        marginTop: 4,
        fontWeight: '600',
    },
    coinIcon: {
        width: 25,
        height: 25,
        marginRight: 6,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 60,
        borderWidth: 1.2,
        marginTop: 5,
        borderColor: '#fff',
    },
    deckInfo: {
        alignItems: 'center',
    },
    deckCount: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    deckLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 2,
    },
    practiceLabel: {
        color: '#0a7ea4',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    opponentHandContainer: {
        paddingVertical: 10,
        maxHeight: 120,
        alignItems: 'center',
    },
    opponentHand: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        justifyContent: 'center',
        flexGrow: 1,
        alignItems: 'center',
    },
    opponentCardWrapper: {
        height: 100,
        justifyContent: 'center',
    },
    opponentCard: {
        elevation: 2,
    },
    playingField: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tableMat: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.40)',
        backgroundColor: 'rgba(120, 120, 120, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trumpContainer: {
        position: 'absolute',
        top: 20,
        left: 20,
        alignItems: 'center',
    },
    trumpLabel: {
        color: '#FFA',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    trumpCard: {
        width: 60,
        height: 90,
        transform: [{ scale: 0.9 }],
        opacity: 0.76,
        borderWidth: 1.2,
    },
    tableCards: {
        width: 120,
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    tableCardContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tableCard: {
        width: 70,
        height: 100,
        elevation: 5,
    },
    tableCardLabel: {
        color: '#fff',
        fontSize: 12,
        marginTop: 5,
        fontWeight: '600',
    },
    messageContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginVertical: 15,
        alignSelf: 'center',
    },
    message: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    playerHandScroll: {
        maxHeight: 130,
    },
    playerHand: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingBottom: 20,
        justifyContent: 'center',
        flexGrow: 1,
        alignItems: 'center',
    },
    playerCardWrapper: {
        width: 80,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerCard: {
        elevation: 3,
        width: '100%',
        height: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    modalContent: {
        backgroundColor: '#444',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        minWidth: 300,
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
    },
    modalScore: {
        fontSize: 24,
        color: '#FFD700',
        marginBottom: 10,
    },
    achievement: {
        fontSize: 18,
        color: '#FFD700',
        fontWeight: 'bold',
        marginVertical: 5,
    },
    modalSubtext: {
        fontSize: 16,
        color: '#AAA',
        marginTop: 10,
        marginBottom: 20,
    },
    coinsEarned: {
        fontSize: 20,
        color: '#FFD700',
        fontWeight: 'bold',
        marginVertical: 15,
    },
    modalButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 15,
        marginTop: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    undoButton: {
        position: 'absolute' as const,
        bottom: 180,
        right: 20,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    undoButtonDisabled: {
        backgroundColor: 'rgba(100, 100, 100, 0.5)',
        opacity: 0.5,
    },
    undoButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold' as const,
    },
    undoCost: {
        position: 'absolute' as const,
        bottom: -5,
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    undoCostText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold' as const,
    },
    undoInfoContent: {
        width: '100%',
        padding: 20,
        alignItems: 'center' as const,
    },
    undoInfoText: {
        color: '#FFF',
        fontSize: 16,
        marginVertical: 5,
        fontWeight: '600' as const,
    },
    undoInfoSubtext: {
        color: '#AAA',
        fontSize: 14,
        marginTop: 15,
        textAlign: 'center' as const,
        fontStyle: 'italic' as const,
    },
});
