import { redirect, error } from '@sveltejs/kit';
import { exchangeCode, createSession, validateState } from '$lib/server/auth.js';

export async function GET({ url, cookies }) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !validateState(state)) {
    error(400, 'Autenticacao invalida');
  }

  const tokenData = await exchangeCode(code, url.origin);

  if (!tokenData) {
    error(502, 'Erro ao autenticar com o Home Assistant');
  }

  const sessionId = createSession(tokenData);

  cookies.set('session', sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: url.protocol === 'https:',
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(302, '/');
}
