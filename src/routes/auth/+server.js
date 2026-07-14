import { redirect } from '@sveltejs/kit';
import { generateState, getAuthUrl } from '$lib/server/auth.js';

export function GET({ url }) {
  const state = generateState();
  const origin = url.origin;
  const authUrl = getAuthUrl(state, origin);

  redirect(302, authUrl);
}
