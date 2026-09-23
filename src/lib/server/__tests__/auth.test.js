import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { HA_URL: 'https://ha.test', DATABASE_PATH: ':memory:' } }));

process.env.DATABASE_PATH = ':memory:';

const { createSession, getSession } = await import('../auth.js');

describe('session refresh', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('refreshes with the client_id used at login, not an env var', async () => {
    const id = createSession(
      { access_token: 'old', refresh_token: 'r1', expires_in: -60 },
      'https://sage.example.pt'
    );

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ access_token: 'new', expires_in: 1800 }), { status: 200 })
    );

    const session = await getSession(id);

    expect(session.accessToken).toBe('new');
    const body = fetchMock.mock.calls[0][1].body;
    expect(body.get('client_id')).toBe('https://sage.example.pt');
    expect(body.get('grant_type')).toBe('refresh_token');
  });

  it('drops a legacy session without client_id instead of refreshing', async () => {
    const id = createSession({ access_token: 'old', refresh_token: 'r2', expires_in: -60 }, undefined);
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    expect(await getSession(id)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await getSession(id)).toBeNull();
  });
});
