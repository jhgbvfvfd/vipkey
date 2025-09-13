
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
import { Agent, Platform, Bot, StandaloneKey } from './types';
import { getPlatforms, getAgents, getBots, getStandaloneKeys } from './services/firebaseService';

type UserRole = 'admin' | 'agent';
interface User {
    role: UserRole;
    data: Agent | { username: string };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password?: string) => Promise<boolean>;
  logout: () => void;
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

const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.darkMode);
    document.documentElement.setAttribute('lang', settings.language);
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
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [platformsData, agentsData, botsData, keysData] = await Promise.all([
                getPlatforms(),
                getAgents(),
                getBots(),
                getStandaloneKeys(),
            ]);
            setPlatforms(platformsData);
            setAgents(agentsData);
            setBots(botsData);
            setStandaloneKeys(keysData);
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
        loading,
        refreshData: fetchData,
    }), [agents, platforms, bots, standaloneKeys, loading, fetchData]);
    
    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = sessionStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = useCallback(async (username: string, password?: string): Promise<boolean> => {
        // Admin Login
        const storedAdminPassword = localStorage.getItem('adminPassword') || 'admin';
        if (username === 'admin' && password === storedAdminPassword) {
            const adminUser: User = { role: 'admin', data: { username: 'admin' } };
            sessionStorage.setItem('user', JSON.stringify(adminUser));
            setUser(adminUser);
            return true;
        }

        // Agent Login
        try {
            const agents = await getAgents();
            const foundAgent = agents.find(agent => agent.username === username && agent.password === password && agent.status !== 'banned');
            if (foundAgent) {
                const agentUser: User = { role: 'agent', data: foundAgent };
                sessionStorage.setItem('user', JSON.stringify(agentUser));
                setUser(agentUser);
                return true;
            }
        } catch (error) {
            console.error("Error fetching agents for login:", error);
        }

        return false;
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem('user');
        setUser(null);
    }, []);

    const authContextValue = useMemo(() => ({
        isAuthenticated: !!user,
        user,
        login,
        logout,
    }), [user, login, logout]);

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};


const App: React.FC = () => {
  return (
    <SettingsProvider>
      <AuthProvider>
        <DataProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </DataProvider>
      </AuthProvider>
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
        <Route path="/generate-key" element={<GenerateKeyPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/api-guide" element={<ApiGuidePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

const AgentRoutes: React.FC = () => (
    <Routes>
        <Route path="/" element={<AgentDashboardPage />} />
        <Route path="/my-keys" element={<AgentKeysPage />} />
        <Route path="/bots" element={<BotsPage />} />
        <Route path="/profile" element={<AgentProfilePage />} />
        <Route path="/usage" element={<AgentUsagePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<Navigate to="/" />} />
    </Routes>
);

export default App;
