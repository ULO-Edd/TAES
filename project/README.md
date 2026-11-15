# TAES – Bisca (React Native / Expo)

A cross-platform (Android, iOS and web) version of **Bisca**, the traditional Portuguese trick-taking card game, played against a bot. Built for the **Software Engineering Advanced Topics (Tópicos Avançados de Engenharia de Software, TAES)** course of the Computer Engineering degree at the Polytechnic of Leiria (ESTG, 2025/26).

The end-to-end tests (Cypress + Cucumber) are in the sibling `cypress` repository.

## Features

- **Authentication** with Supabase, plus a guest mode
- **Game modes**
  - *Practice*: a single game against the bot
  - *Match*: first to 4 games wins; costs a coin entry fee and pays out coins, with bonuses for *capote* and *bandeira* wins
- **Bot opponent**: the app uses `SimpleBot`; the engine also includes a `SmartBot` strategy
- **Coins economy** tied to the player's profile
- **History** of past games with a details view
- **Scoreboard** that ranks players
- **Customization**: avatars and card themes
- **Notifications** (native and web)
- Light and dark themes, haptic feedback and in-game audio

## Tech stack

- [Expo](https://expo.dev/) SDK 54, React Native 0.81 and React 19
- Expo Router (file-based routing, typed routes)
- [Supabase](https://supabase.com/) (auth, `profiles` table, `avatars` storage)
- React Native Paper, Reanimated and Gesture Handler
- TypeScript

## Project structure

```
app/
├── (tabs)/            # Home, Scoreboard, History, Customization
├── game.tsx           # Game screen
└── _layout.tsx
game/                  # Game engine (no UI)
├── bisca.ts           # Rules, tricks, scoring
├── deck.ts  player.ts
├── bot.ts             # SimpleBot / SmartBot strategies
├── game-manager.ts  game-mode-manager.ts  match-manager.ts
└── card-themes.ts
components/  context/  hooks/  lib/  constants/  assets/
```

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from the template and add your Supabase project credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. Start the app:

   ```bash
   npx expo start          # then press a (Android), i (iOS) or w (web)
   ```

   For the E2E tests, run the web build on port 8081: `npx expo start --web --port 8081`.

Lint with `npm run lint`.

Academic project (TAES 2025/26, group E). Polytechnic of Leiria, School of Technology and Management (ESTG).
