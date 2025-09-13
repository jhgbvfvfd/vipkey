
export interface ApiKey {
  key: string;
  tokens_remaining: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface CreditHistoryEntry {
  date: string;
  action: string;
  amount: number; // positive for additions, negative for deductions
  balanceAfter: number;
}

export interface Agent {
  id: string;
  username: string;
  password?: string;
  credits: number;
  keys?: {
    [platformId: string]: ApiKey[];
  };
  createdAt: string;
  creditHistory?: CreditHistoryEntry[];
  user?: null; // Added for future use
}

export interface StandaloneKey extends ApiKey {
    id: string;
    platformId: string;
    platformTitle: string;
}

export interface Platform {
  id: string;
  title: string;
  prefix: string;
  pattern: number[];
  apiEnabled?: boolean;
}

export interface Bot {
    id: string;
    name: string;
    url: string;
    addedAt: string;
}