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
  const pathParts = event.path.split('/');
  const platformId = pathParts[pathParts.length - 1];
  const keyParam = event.queryStringParameters?.key;

  if (!platformId || !keyParam) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: 'MISSING_PARAMS', message: 'platform and key are required' }),
    };
  }

  // search key within all agent-owned keys
  const agentsRes = await fetch(`${FIREBASE_URL}agents.json`);
  if (!agentsRes.ok) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'FETCH_AGENTS_FAILED' }) };
  }
  const agentsData: Record<string, AgentRecord> | null = await agentsRes.json();
  let foundAgentId: string | null = null;
  let foundKey: ApiKey | null = null;

  if (agentsData) {
    outer: for (const [agentId, agent] of Object.entries(agentsData)) {
      const platformKeys = Object.values(agent.keys || {});
      for (const keys of platformKeys) {
        const match = keys.find((k) => k.key === keyParam);
        if (match) {
          foundAgentId = agentId;
          foundKey = match;
          break outer;
        }
      }
    }
  }

  // if not found under agents, search standalone keys (ignoring platform)
  if (!foundKey) {
    const standaloneRes = await fetch(`${FIREBASE_URL}standalone_keys.json`);
    if (!standaloneRes.ok) {
      return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'FETCH_KEYS_FAILED' }) };
    }
    const standaloneData: Record<string, ApiKey & { platformId?: string }> | null = await standaloneRes.json();
    if (standaloneData) {
      for (const key of Object.values(standaloneData)) {
        if (key.key === keyParam) {
          foundKey = key;
          foundAgentId = 'standalone';
          break;
        }
      }
    }
  }

  if (!foundKey) {
    return {
      statusCode: 404,
      body: JSON.stringify({ ok: false, error: 'KEY_NOT_FOUND', message: 'The provided key does not exist.' }),
    };
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  await fetch(`${FIREBASE_URL}key_logs.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: keyParam, agentId: foundAgentId, ip, usedAt: new Date().toISOString() }),
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, tokens_remaining: foundKey.tokens_remaining, status: foundKey.status }),
  };
};

export { handler };
