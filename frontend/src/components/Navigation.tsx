import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { email: string; role: string; full_name?: string } | null;
  onLogout: () => void;
}

export const Navigation: React.FC<NavProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', num: '01' },
    { id: 'datasets', label: 'Datasets', num: '02' },
    { id: 'experiments', label: 'Experiments', num: '03' },
    { id: 'models', label: 'Model Registry', num: '04' },
    { id: 'predict', label: 'Risk Predict', num: '05' },
    { id: 'nlp', label: 'Clinical NLP', num: '06' },
    { id: 'settings', label: 'Settings', num: '07' },
  ];

  return (
    <header style={{ borderBottom: '1px solid #D8D2CC', backgroundColor: '#FAF9F6' }}>
      {/* Editorial Disclaimer Banner */}
      <div 
        style={{ 
          backgroundColor: '#64141A', 
          color: '#FAF9F6', 
          fontSize: '0.725rem', 
          letterSpacing: '0.04em',
          padding: '0.45rem 1.5rem', 
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}
      >
        <span style={{ color: '#F4DDDE', fontWeight: 600, textTransform: 'uppercase', marginRight: '0.5rem' }}>
          Clinical Notice:
        </span>
        Demonstration platform strictly for healthcare AI research & education. Not for clinical diagnostic use.
      </div>

      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo - Cormorant Garamond */}
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} 
          onClick={() => setActiveTab('dashboard')}
        >
          <div style={{ backgroundColor: '#B4232D', color: '#FFFFFF', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem' }}>
            H
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
              <span className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#191716', lineHeight: 1 }}>
                HealthLens
              </span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B4232D', border: '1px solid #D8D2CC', padding: '1px 5px' }}>
                v1.0 RESEARCH
              </span>
            </div>
            <p style={{ fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#625E5A', marginTop: '2px' }}>
              Healthcare AI & MLOps System
            </p>
          </div>
        </div>

        {/* Clinical Navigation Bar */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.15rem' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '0px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #B4232D' : '2px solid transparent',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.775rem',
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.03em',
                  color: isActive ? '#B4232D' : '#625E5A',
                  backgroundColor: isActive ? '#F5F2ED' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '0.65rem', color: isActive ? '#B4232D' : '#8C857E', fontFamily: 'Inter, sans-serif' }}>
                  {item.num}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#191716', fontFamily: 'Inter, sans-serif' }}>
                  {currentUser.full_name || currentUser.email}
                </div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: currentUser.role === 'ADMIN' ? '#B4232D' : '#625E5A', fontWeight: 600 }}>
                  {currentUser.role}
                </span>
              </div>
              <button 
                onClick={onLogout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', borderRadius: '0px' }}
                title="Sign Out"
              >
                <LogOut size={13} />
                <span style={{ marginLeft: '4px' }}>EXIT</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('login')}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.775rem', borderRadius: '0px' }}
            >
              <UserIcon size={14} />
              <span>SIGN IN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

