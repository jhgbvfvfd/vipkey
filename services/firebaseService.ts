
import { Platform, Agent, Bot, ApiKey, StandaloneKey, KeyLog, IpBan } from '../types';

// IMPORTANT: In a real application, these values should come from environment variables.
// For this example, we are using the URL provided in the prompt.
const FIREBASE_URL = 'https://fgddf-a6f13-default-rtdb.firebaseio.com/';

async function fetchData<T,>(path: string): Promise<T> {
  const response = await fetch(`${FIREBASE_URL}${path}.json`);
  if (!response.ok) {
    throw new Error(`Firebase fetch error: ${response.statusText}`);
  }
  return response.json();
}

async function setData<T,>(path: string, data: T): Promise<void> {
  const response = await fetch(`${FIREBASE_URL}${path}.json`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Firebase set data error: ${response.statusText}`);
  }
}

async function deleteData(path: string): Promise<void> {
    const response = await fetch(`${FIREBASE_URL}${path}.json`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`Firebase delete data error: ${response.statusText}`);
    }
}


// Helper to convert Firebase object response to array
const firebaseObjectToArray = <T extends {id: string}>(data: Record<string, Omit<T, 'id'>> | null): T[] => {
    if (!data) return [];
    return Object.entries(data).map(([id, value]) => ({ id, ...value } as T));
}

export const getPlatforms = async (): Promise<Platform[]> => {
    const data = await fetchData<Record<string, Omit<Platform, 'id'>>>('platforms');
    return firebaseObjectToArray(data);
};

export const addPlatform = async (platform: Omit<Platform, 'id'> & {id: string}): Promise<void> => {
    const { id, ...platformData } = platform;
    await setData(`platforms/${id}`, platformData);
};

export const updatePlatform = async(platform: Platform): Promise<void> => {
    const { id, ...platformData } = platform;
    await setData(`platforms/${id}`, platformData);
}

export const deletePlatform = async(platformId: string): Promise<void> => {
    await deleteData(`platforms/${platformId}`);
}

export const getAgents = async (): Promise<Agent[]> => {
    const data = await fetchData<Record<string, Omit<Agent, 'id'>>>('agents');
    const agents = firebaseObjectToArray(data);
    const now = Date.now();
    const expiredAgents = agents.filter(agent => {
        if (!agent.expirationAt) return false;
        const expirationTime = new Date(agent.expirationAt).getTime();
        return !Number.isNaN(expirationTime) && expirationTime <= now;
    });

    if (expiredAgents.length > 0) {
        await Promise.all(
            expiredAgents.map(agent =>
                deleteData(`agents/${agent.id}`).catch(error => {
                    console.error(`Failed to delete expired agent ${agent.id}:`, error);
                })
            )
        );
    }

    return agents.filter(agent => !expiredAgents.some(expired => expired.id === agent.id));
};

export const addAgent = async (agent: Omit<Agent, 'id'> & {id: string}): Promise<void> => {
    const { id, ...agentData } = agent;
    await setData(`agents/${id}`, agentData);
};

export const updateAgent = async(agent: Agent): Promise<void> => {
    const { id, ...agentData } = agent;
    await setData(`agents/${id}`, agentData);
}

export const deleteAgent = async(agentId: string): Promise<void> => {
    await deleteData(`agents/${agentId}`);
}

export const getStandaloneKeys = async (): Promise<StandaloneKey[]> => {
    const data = await fetchData<Record<string, Omit<StandaloneKey, 'id'>>>('standalone_keys');
    return firebaseObjectToArray(data);
}

export const addStandaloneKey = async (key: Omit<StandaloneKey, 'id'> & {id: string}): Promise<void> => {
    const { id, ...keyData } = key;
    await setData(`standalone_keys/${id}`, keyData);
}

export const updateStandaloneKey = async(key: StandaloneKey): Promise<void> => {
    const { id, ...keyData } = key;
    await setData(`standalone_keys/${id}`, keyData);
}

export const deleteStandaloneKey = async(keyId: string): Promise<void> => {
    await deleteData(`standalone_keys/${keyId}`);
}

export const getBots = async (): Promise<Bot[]> => {
    const data = await fetchData<Record<string, Omit<Bot, 'id'>>>('bots');
    return firebaseObjectToArray(data);
};

export const addBot = async (bot: Omit<Bot, 'id'> & {id: string}): Promise<void> => {
    const { id, ...botData } = bot;
    await setData(`bots/${id}`, botData);
};

export const updateBot = async (bot: Bot): Promise<void> => {
    const { id, ...botData } = bot;
    await setData(`bots/${id}`, botData);
};

export const deleteBot = async (botId: string): Promise<void> => {
    await deleteData(`bots/${botId}`);
};

export const getKeyLogs = async (): Promise<KeyLog[]> => {
    const data = await fetchData<Record<string, Omit<KeyLog, 'id'>>>('key_logs');
    return firebaseObjectToArray(data);
};

export const recordKeyLog = async (log: Omit<KeyLog, 'id'>): Promise<void> => {
    await fetch(`${FIREBASE_URL}key_logs.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
    });
};

export const getIpBans = async (userId: string): Promise<IpBan[]> => {
    const data = await fetchData<Record<string, Omit<IpBan, 'id'>>>(`ip_bans/${userId}`);
    return firebaseObjectToArray(data);
};

export const addIpBan = async (userId: string, ip: string): Promise<void> => {
    const entry = { ip, userId, createdAt: new Date().toISOString() };
    await fetch(`${FIREBASE_URL}ip_bans/${userId}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
};

export const deleteIpBan = async (userId: string, id: string): Promise<void> => {
    await deleteData(`ip_bans/${userId}/${id}`);
};
