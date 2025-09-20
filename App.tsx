
import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { translations, Language } from './utils/i18n';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import PlatformsPage from './pages/PlatformsPage';
import AgentsPage from './pages/AgentsPage';
import BotsPage from './pages/BotsPage';
import ApiGuidePage from './pages/ApiGuidePage';
import GenerateKeyPage from './pages/GenerateKeyPage';
import AgentDashboardPage from './pages/AgentDashboardPage';
import AgentKeysPage from './pages/AgentKeysPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import AgentProfilePage from './pages/AgentProfilePage';
import AgentUsagePage from './pages/AgentUsagePage';
import KeyLogsPage from './pages/KeyLogsPage';
import IpBanPage from './pages/IpBanPage';
import AgentMenusPage from './pages/AgentMenusPage';
import AgentGenerateKeyPage from './pages/AgentGenerateKeyPage';
import AgentAgentsPage from './pages/AgentAgentsPage';
import MaintenancePage from './pages/MaintenancePage';
import { Agent, Platform, Bot, StandaloneKey, KeyLog, MaintenanceConfig } from './types';
import { getPlatforms, getAgents, getBots, getStandaloneKeys, getKeyLogs, getAdminPassword, setAdminPassword, getMaintenanceConfig, saveMaintenanceConfig } from './services/firebaseService';

type UserRole = 'admin' | 'agent';
interface User {
    role: UserRole;
    data: Agent | { username: string };
}

interface LoginOptions {
  clientIp?: string;
  skipMaintenanceCheck?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password?: string, options?: LoginOptions) => Promise<'success' | 'banned' | 'invalid' | 'maintenance'>;
  logout: () => void;
  updateUserData: (data: Agent) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface DataContextType {
    agents: Agent[];
    platforms: Platform[];
    bots: Bot[];
    standaloneKeys: StandaloneKey[];
    keyLogs: KeyLog[];
    loading: boolean;
    refreshData: () => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

interface Settings {
  notifications: boolean;
  darkMode: boolean;
  language: Language;
}

const defaultSettings: Settings = {
  notifications: true,
  darkMode: false,
  language: 'th',
};

interface SettingsContextType {
  settings: Settings;
  updateSettings: (s: Settings) => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
  t: (key: keyof typeof translations['en']) => string;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
};

interface MaintenanceContextType {
  config: MaintenanceConfig;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (config: MaintenanceConfig) => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | null>(null);

export const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error('useMaintenance must be used within MaintenanceProvider');
  }
  return ctx;
};

const defaultMaintenanceState: MaintenanceConfig = {
  enabled: false,
  message: 'ระบบกำลังปิดปรับปรุงเพื่ออัปเดต',
  allowedAdminIps: [],
};

const sanitizeIps = (ips?: string[]): string[] => {
  if (!Array.isArray(ips)) return [];
  return ips
    .map((ip) => (typeof ip === 'string' ? ip.trim() : ''))
    .filter((ip) => ip.length > 0);
};

const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<MaintenanceConfig>(defaultMaintenanceState);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await getMaintenanceConfig();
      setConfig({
        ...defaultMaintenanceState,
        ...remote,
        allowedAdminIps: sanitizeIps(remote.allowedAdminIps),
      });
    } catch (error) {
      console.error('Failed to refresh maintenance config:', error);
      setConfig(defaultMaintenanceState);
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(async (nextConfig: MaintenanceConfig) => {
    const normalized: MaintenanceConfig = {
      ...defaultMaintenanceState,
      ...nextConfig,
      allowedAdminIps: sanitizeIps(nextConfig.allowedAdminIps),
    };
    try {
      await saveMaintenanceConfig(normalized);
      setConfig(normalized);
    } catch (error) {
      console.error('Failed to save maintenance config:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ config, loading, refresh, update }),
    [config, loading, refresh, update]
  );

  return <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>;
};

const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', settings.language);
  }, [settings.language]);

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (s: Settings) => setSettings(s);

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (!settings.notifications) return;
    type === 'success' ? toast.success(message) : toast.error(message);
  }, [settings.notifications]);

  const t = useCallback((key: keyof typeof translations['en']) => {
    return translations[settings.language][key] || key;
  }, [settings.language]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, notify, t }}>
      {children}
    </SettingsContext.Provider>
  );
};

const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [platforms, setPlatforms] = useState<Platform[]>([]);
    const [bots, setBots] = useState<Bot[]>([]);
    const [standaloneKeys, setStandaloneKeys] = useState<StandaloneKey[]>([]);
    const [keyLogs, setKeyLogs] = useState<KeyLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [platformsData, agentsData, botsData, keysData, logsData] = await Promise.all([
                getPlatforms(),
                getAgents(),
                getBots(),
                getStandaloneKeys(),
                getKeyLogs(),
            ]);
            setPlatforms(platformsData);
            setAgents(agentsData);
            setBots(botsData);
            setStandaloneKeys(keysData);
            setKeyLogs(logsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const value = useMemo(() => ({
        agents,
        platforms,
        bots,
        standaloneKeys,
        keyLogs,
        loading,
        refreshData: fetchData,
    }), [agents, platforms, bots, standaloneKeys, keyLogs, loading, fetchData]);
    
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = useCallback(async (username: string, password?: string, options?: LoginOptions): Promise<'success' | 'banned' | 'invalid' | 'maintenance'> => {
        if (!options?.skipMaintenanceCheck) {
            try {
                const maintenance = await getMaintenanceConfig();
                if (maintenance.enabled) {
                    const allowedIps = sanitizeIps(maintenance.allowedAdminIps);
                    const ipAllowed = options?.clientIp ? allowedIps.includes(options.clientIp.trim()) : false;
                    const isAdminAttempt = username === 'admin';
                    if (!isAdminAttempt || !ipAllowed) {
                        return 'maintenance';
                    }
                }
            } catch (error) {
                console.error('Failed to check maintenance mode during login:', error);
            }
        }

        // Admin Login
        if (username === 'admin' && typeof password === 'string') {
            const { password: storedAdminPassword, source } = await getAdminPassword();
            if (password === storedAdminPassword) {
                if (source !== 'remote') {
                    try {
                        await setAdminPassword(storedAdminPassword);
                    } catch (error) {
                        console.error('Failed to sync admin password to database:', error);
                    }
                }
                const adminUser: User = { role: 'admin', data: { username: 'admin' } };
                sessionStorage.setItem('user', JSON.stringify(adminUser));
                setUser(adminUser);
                return 'success';
            }
        }

        // Agent Login
        try {
            const agents = await getAgents();
            const foundAgent = agents.find(agent => agent.username === username && agent.password === password);
            if (foundAgent) {
                if (foundAgent.status === 'banned') {
                    return 'banned';
                }
                const agentUser: User = { role: 'agent', data: foundAgent };
                sessionStorage.setItem('user', JSON.stringify(agentUser));
                setUser(agentUser);
                return 'success';
            }
        } catch (error) {
            console.error("Error fetching agents for login:", error);
        }

        return 'invalid';
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('user');
        setUser(null);
    }, []);

    const updateUserData = useCallback((data: Agent) => {
        if (!user) return;
        const newUser: User = { ...user, data };
        sessionStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
    }, [user]);

    const authContextValue = useMemo(() => ({
        isAuthenticated: !!user,
        user,
        login,
        logout,
        updateUserData,
    }), [user, login, logout, updateUserData]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};


const App: React.FC = () => {
  return (
    <SettingsProvider>
      <MaintenanceProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
            <Toaster position="top-right" />
          </DataProvider>
        </AuthProvider>
      </MaintenanceProvider>
    </SettingsProvider>
  );
};

const AppRoutes: React.FC = () => {
    const { isAuthenticated } = useAuth();
    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />
                <Route path="/*" element={isAuthenticated ? <ProtectedRoutes /> : <Navigate to="/login" />} />
            </Routes>
        </HashRouter>
    );
}

const ProtectedRoutes: React.FC = () => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    return (
        <Layout>
            {user.role === 'admin' && <AdminRoutes />}
            {user.role === 'agent' && <AgentRoutes />}
        </Layout>
    );
};

const AdminRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/platforms" element={<PlatformsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agent-menus" element={<AgentMenusPage />} />
        <Route path="/generate-key" element={<GenerateKeyPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/api-guide" element={<ApiGuidePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/logs" element={<KeyLogsPage />} />
        <Route path="/ip-bans" element={<IpBanPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

const AgentRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<AgentDashboardPage />} />
        <Route path="/my-keys" element={<AgentKeysPage />} />
        <Route path="/generate-key" element={<AgentGenerateKeyPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/profile" element={<AgentProfilePage />} />
        <Route path="/agents" element={<AgentAgentsPage />} />
        <Route path="/usage" element={<AgentUsagePage />} />
        <Route path="/logs" element={<KeyLogsPage />} />
        <Route path="/ip-bans" element={<IpBanPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default App;
