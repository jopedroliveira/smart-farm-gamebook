import { randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';
import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

function haUrl() {
  return env.HA_URL || 'http://homeassistant.local:8123';
}

export function getHaUrl() {
  return haUrl();
}

const pendingStates = new Map();

export function generateState() {
  const state = randomBytes(32).toString('hex');
  pendingStates.set(state, Date.now());
  return state;
}

export function validateState(state) {
  if (!state || !pendingStates.has(state)) return false;
  const created = pendingStates.get(state);
  pendingStates.delete(state);
  return (Date.now() - created) < 300000;
}

export function getAuthUrl(state, origin) {
  const params = new URLSearchParams({
    client_id: origin,
    redirect_uri: `${origin}/auth/callback`,
    state,
    response_type: 'code',
  });
  return `${haUrl()}/auth/authorize?${params}`;
}

export async function exchangeCode(code, origin) {
  const url = `${haUrl()}/auth/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: origin,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  const res = await fetch(url, {
    signal: controller.signal,
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  clearTimeout(timeout);
  if (!res.ok) return null;
  return res.json();
}

// HA rejects a refresh whose client_id differs from the one the refresh
// token was issued to, so it must be the origin used at login.
async function refreshAccessToken(refresh, clientId) {
  const res = await fetch(`${haUrl()}/auth/token`, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh,
      client_id: clientId,
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

export function createSession(tokenData, clientId) {
  const db = getDb();
  const id = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + tokenData.expires_in * 1000;

  db.insert(schema.sessions).values({
    id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt,
    clientId,
  }).run();

  return id;
}

export async function getSession(sessionId) {
  if (!sessionId) return null;
  const db = getDb();

  const row = db.select().from(schema.sessions)
    .where(eq(schema.sessions.id, sessionId)).get();

  if (!row) return null;

  if (Date.now() > row.expiresAt - 30000) {
    // sessions from before client_id was stored cannot be refreshed: log in again
    const refreshed = row.clientId
      ? await refreshAccessToken(row.refreshToken, row.clientId)
      : null;
    if (!refreshed) {
      deleteSession(sessionId);
      return null;
    }

    const newExpiry = Date.now() + refreshed.expires_in * 1000;
    db.update(schema.sessions)
      .set({ accessToken: refreshed.access_token, expiresAt: newExpiry })
      .where(eq(schema.sessions.id, sessionId)).run();

    return {
      accessToken: refreshed.access_token,
      refreshToken: row.refreshToken,
      expiresAt: newExpiry,
    };
  }

  return {
    accessToken: row.accessToken,
    refreshToken: row.refreshToken,
    expiresAt: row.expiresAt,
  };
}

export function deleteSession(sessionId) {
  const db = getDb();
  db.delete(schema.sessions)
    .where(eq(schema.sessions.id, sessionId)).run();
}
