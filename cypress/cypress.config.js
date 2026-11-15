import { defineConfig } from "cypress";
import { setupNodeEvents } from "./cypress/support/plugins/setupNodeEvents.js";

export default defineConfig({
  env: {
    BASE_URL: "http://localhost:8081",
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  viewportHeight: 896,
  viewportWidth: 414,
  video: false,
  defaultCommandTimeout: 10000,
  e2e: {
    baseUrl: "http://localhost:8081",
    specPattern: "cypress/e2e/**/*.feature",
    excludeSpecPattern: "**/*.js",
    setupNodeEvents,
  },
});
