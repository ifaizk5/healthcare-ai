import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ModelsPage } from './pages/ModelsPage';
import { PredictPage } from './pages/PredictPage';
import { NLPPage } from './pages/NLPPage';
import { SettingsPage } from './pages/SettingsPage';
import { ApiService } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (ApiService.getToken()) {
        const user = await ApiService.getMe();
        if (user) {
          setCurrentUser(user);
        } else {
          ApiService.clearToken();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const handleLogout = () => {
    ApiService.clearToken();
    setCurrentUser(null);
    setActiveTab('login');
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAF9F6' }}>
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <main style={{ flex: 1, paddingBottom: '4rem' }}>
        {activeTab === 'login' && <LoginPage onLoginSuccess={handleLoginSuccess} />}
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'datasets' && <DatasetsPage />}
        {activeTab === 'experiments' && <ExperimentsPage />}
        {activeTab === 'models' && <ModelsPage />}
        {activeTab === 'predict' && <PredictPage />}
        {activeTab === 'nlp' && <NLPPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <footer style={{ borderTop: '1px solid #D8D2CC', padding: '1.75rem 2rem', textAlign: 'center', fontSize: '0.725rem', color: '#625E5A', backgroundColor: '#FAF9F6', fontFamily: 'Inter, sans-serif' }}>
        <span className="font-serif" style={{ fontSize: '1rem', fontWeight: 600, color: '#191716', marginRight: '0.75rem' }}>
          HealthLens Clinical System
        </span>
        &bull; Institutional Healthcare AI & MLOps Infrastructure &bull; FastAPI + React + Cormorant Garamond Typography
      </footer>
    </div>
  );
};

export default App;

