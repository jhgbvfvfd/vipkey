import { Handler } from '@netlify/functions';

const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

interface ApiKey {
  key: string;
  tokens_remaining: number;
  status: 'active' | 'inactive';
}

interface AgentRecord {
  keys?: Record<string, ApiKey[]>;
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const segments = event.path.split('/').filter(Boolean);
  // path shape: /api/:platform/use
  const platformId = segments[segments.length - 2];

  let body: { key?: string; tokens?: number } = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'INVALID_JSON' }) };
  }

  const { key: keyParam, tokens } = body;

  if (!platformId || !keyParam || typeof tokens !== 'number') {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'MISSING_PARAMS', message: 'platform, key and tokens are required' }),
    };
  }

  let foundKey: ApiKey | null = null;
  let updatePath: string | null = null;
  let foundAgentId: string | null = null;

  // check platform-specific key store
  const platformKeyRes = await fetch(
    `${FIREBASE_URL}${platformId}_keys/${encodeURIComponent(keyParam)}.json`
  );
  if (platformKeyRes.ok) {
    const data: Omit<ApiKey, 'key'> | null = await platformKeyRes.json();
    if (data) {
      foundKey = { key: keyParam, ...data };
      updatePath = `${platformId}_keys/${encodeURIComponent(keyParam)}`;
    }
  }

  // search key within agent-owned keys for this platform only
  if (!foundKey) {
    const agentsRes = await fetch(`${FIREBASE_URL}agents.json`);
    if (agentsRes.ok) {
      const agentsData: Record<string, AgentRecord> | null = await agentsRes.json();
      if (agentsData) {
        outer: for (const [agentId, agent] of Object.entries(agentsData)) {
          const keys = agent.keys?.[platformId] || [];
          for (let i = 0; i < keys.length; i++) {
            if (keys[i].key === keyParam) {
              foundKey = keys[i];
              updatePath = `agents/${agentId}/keys/${platformId}/${i}`;
              foundAgentId = agentId;
              break outer;
            }
          }
        }
      }
    }
  }

  // search standalone keys that belong to this platform
  if (!foundKey) {
    const standaloneRes = await fetch(`${FIREBASE_URL}standalone_keys.json`);
    if (standaloneRes.ok) {
      const standaloneData: Record<string, ApiKey & { platformId?: string }> | null = await standaloneRes.json();
      if (standaloneData) {
        for (const [id, key] of Object.entries(standaloneData)) {
          if (key.key === keyParam && key.platformId === platformId) {
            foundKey = key;
            updatePath = `standalone_keys/${id}`;
            foundAgentId = 'standalone';
            break;
          }
        }
      }
    }
  }

  if (!foundKey || !updatePath) {
    return {
      statusCode: 404,
      body: JSON.stringify({ ok: false, error: 'KEY_NOT_FOUND', message: 'The provided key does not exist.' }),
    };
  }

  if (foundKey.tokens_remaining < tokens) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'INSUFFICIENT_TOKENS', message: 'Not enough tokens remaining.' }),
    };
  }

  const newRemaining = foundKey.tokens_remaining - tokens;

  await fetch(`${FIREBASE_URL}${updatePath}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokens_remaining: newRemaining }),
  });

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  await fetch(`${FIREBASE_URL}key_logs.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyParam, agentId: foundAgentId, ip, usedAt: new Date().toISOString(), tokensUsed: tokens }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, tokens_remaining: newRemaining }),
  };
};

export { handler };

