import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import createBundler from '@bahmutov/cypress-esbuild-preprocessor';
import { addCucumberPreprocessorPlugin } from '@badeball/cypress-cucumber-preprocessor';
import createEsbuildPlugin from '@badeball/cypress-cucumber-preprocessor/esbuild';

async function setupNodeEvents(on, config) {
  await addCucumberPreprocessorPlugin(on, config);

  on(
    'file:preprocessor',
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

  // `pg_dump` and `psql` available on PATH and a Postgres connection
  on('task', {
    backupDb() {
      try {
        const fixturePath = path.join(config.projectRoot, 'cypress', 'fixtures', 'sql.sql');
        if (fs.existsSync(fixturePath)) {
          return { exists: true, path: fixturePath };
        }

        const databaseUrl = config.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('No Postgres connection string found. Add `DATABASE_URL` to `cypress.env.json`.');
        }

        const fixturesDir = path.dirname(fixturePath);
        if (!fs.existsSync(fixturesDir)) fs.mkdirSync(fixturesDir, { recursive: true });

        const args = ['--dbname', databaseUrl, '--no-owner', '--no-privileges', '--data-only', '--table', 'profiles', '--file', fixturePath];
        const res = spawnSync('pg_dump', args, { stdio: 'inherit', shell: false });
        if (res.error) {
          throw res.error;
        }
        if (res.status !== 0) {
          throw new Error('pg_dump exited with code ' + res.status);
        }
        return { created: true, path: fixturePath };
      } catch (err) {
        console.error('ensureDbSnapshot task failed:', err && err.message ? err.message : err);
        throw err;
      }
    },

    restoreDb() {
      try {
        const fixturePath = path.join(config.projectRoot, 'cypress', 'fixtures', 'sql.sql');
        if (!fs.existsSync(fixturePath)) {
          return { restored: false, reason: 'snapshot missing' };
        }

        const databaseUrl = config.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('No Postgres connection string found. Add `DATABASE_URL` to `cypress.env.json`.');
        }

        const sqlBackupContent = fs.readFileSync(fixturePath, 'utf-8');
        const sqlWithDelete = `DELETE FROM profiles;\n${sqlBackupContent}`;

        const tempSqlPath = path.join(config.projectRoot, 'cypress', 'fixtures', '.restore-temp.sql');
        fs.writeFileSync(tempSqlPath, sqlWithDelete);

        const args = ['--dbname', databaseUrl, '-v', 'ON_ERROR_STOP=1', '-f', tempSqlPath];
        const res = spawnSync('psql', args, { stdio: 'inherit', shell: false });

        if (fs.existsSync(tempSqlPath)) {
          fs.unlinkSync(tempSqlPath);
        }

        if (res.error) {
          throw res.error;
        }
        if (res.status !== 0) {
          throw new Error('psql exited with code ' + res.status);
        }
        return { restored: true };
      } catch (err) {
        console.error('restoreDbSnapshot task failed:', err && err.message ? err.message : err);
        throw err;
      }
    },
  });
  return config;
}
export { setupNodeEvents };
