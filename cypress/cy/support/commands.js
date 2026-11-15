import { generateLeaderboard } from './helper';

Cypress.Commands.add('setColorCucumberSteps', () => {
  const css = '.reproted strong { color: red !important; }';
  const $head = Cypress.$(parent.window.document.head);
  if ($head.find('#highlight-steps').lenght > 0) return;
  $head.append(`<style type="text/css" id="highlight-steps">\n${css}</style>`);
});

Cypress.Commands.add('supabaseLogin', (email, password) => {
  const supabaseUrl = Cypress.env('SUPABASE_URL');
  const supabaseKey = Cypress.env('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set');
  }

  let authSession;

  cy.request({
    method: 'POST',
    url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
    headers: {
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: {
      email,
      password,
    },
  }).then((resp) => {
    expect(resp.status).to.eq(200);
    expect(resp.body).to.have.property('access_token');

    authSession = resp.body;

    const localStorageKey = `sb-duwhnopmrufzzqrvtifa-auth-token`;

    const authData = {
      access_token: authSession.access_token,
      refresh_token: authSession.refresh_token,
      expires_in: authSession.expires_in,
      expires_at: authSession.expires_at,
      token_type: authSession.token_type,
      user: authSession.user,
    };

    cy.window().then((win) => {
      win.localStorage.setItem(localStorageKey, JSON.stringify(authData));
      cy.log(`Auth token stored in localStorage as: ${localStorageKey}`);
    });
  });
});

Cypress.Commands.add(
  'mockPersonalReq',
  (played, wins, winrate, capotes, bandeiras) => {
    cy.intercept(
      'GET',
      `${Cypress.env('SUPABASE_URL')}/rest/v1/personal_stats*`,
      (req) => {
        req.reply((res) => {
          res.body.matches_played = played;
          res.body.wins = wins;
          res.body.win_rate = winrate;
          res.body.capotes = capotes;
          res.body.bandeiras = bandeiras;
          res.send();
        });
      },
    ).as('getPersonalStats');
  },
);

Cypress.Commands.add('mockGlobalReq', (min, max) => {
  cy.intercept(
    'GET',
    `${Cypress.env('SUPABASE_URL')}/rest/v1/leaderboard_matches_won?select=*&order=matches_won.desc%2Cusername.asc&offset=10&limit=10`,
    (req) => {
      req.reply((res) => {
        res.body = generateLeaderboard(10, min, max, 'matches_won');
        res.send();
      });
    },
  ).as('getGlobalStats');
});
