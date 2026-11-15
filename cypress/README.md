# TAES – Bisca E2E Tests (Cypress + Cucumber)

End-to-end acceptance tests for the **Bisca** mobile/web card game (the sibling `project` repository). Built for the **Software Engineering Advanced Topics (Tópicos Avançados de Engenharia de Software, TAES)** course of the Computer Engineering degree at the Polytechnic of Leiria (ESTG, 2025/26).

The tests are written in Gherkin (BDD) and run with Cypress against the Expo web build of the app, using a mobile-sized viewport (414×896).

## What is covered

| Area          | Feature files                                                      |
|---------------|--------------------------------------------------------------------|
| Login / guest | `login.feature`, `guest_login.feature`, `guest_alert.feature`      |
| Dashboard     | `dashboard.feature`, `navigation.feature`                          |
| Gameplay      | `gameplay.feature`, `game_screen.feature`, `match_mode.feature`    |
| History       | `history.feature`, `history_details.feature`                       |
| Scoreboard    | `scoreboard.feature`                                               |
| Customization | `customization.feature`                                            |
| Notifications | `notification.feature`                                             |

## Structure

```
cypress/
├── e2e/                      # .feature files, grouped by area
├── screens/                  # Screen objects (page-object pattern)
├── support/
│   ├── step_definitions/     # Shared Gherkin step implementations
│   ├── plugins/              # Cucumber + esbuild setup, DB backup/restore tasks
│   ├── commands.js
│   └── helper.js
└── fixtures/                 # Test data
```

Before a run, the database is backed up (`pg_dump`) and then restored afterwards, so tests can change data safely. This needs `pg_dump` and `psql` on your `PATH`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local config files from the examples (the real ones are git-ignored):

   ```bash
   cp cypress.env.example.json cypress.env.json
   cp cypress/fixtures/valid_creds.example.json cypress/fixtures/valid_creds.json
   ```

   Fill in your Supabase project URL, anon key, Postgres connection string, and the credentials of a test user that exists in that project.

3. Start the app's web build on port 8081 (in the `project` repository):

   ```bash
   npx expo start --web --port 8081
   ```

## Running

```bash
npm run cy:open   # interactive runner
npm run cy:run    # headless
```

Cucumber JSON and HTML reports are written to `cypress/cucumber-json/` and `cypress/results/`.

## Tech stack

- Cypress 15
- `@badeball/cypress-cucumber-preprocessor` (Gherkin/BDD)
- esbuild preprocessor
- ESLint with `eslint-plugin-cypress`

Academic project (TAES 2025/26, group E). Polytechnic of Leiria, School of Technology and Management (ESTG).
