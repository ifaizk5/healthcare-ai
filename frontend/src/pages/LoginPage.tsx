import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { Lock, Mail, User as UserIcon, LogIn, CheckCircle2 } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@healthlens.ai');
  const [password, setPassword] = useState('AdminSecret123!');
  const [fullName, setFullName] = useState('Dr. Alex Rivera (Lead MLE)');
  const [role, setRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch('http://localhost:8000/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, full_name: fullName, role }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || 'Registration failed');
        }
      }

      const loginRes = await ApiService.login(email, password);
      const user = await ApiService.getMe();
      onLoginSuccess(user || { email: loginRes.user_email, role: loginRes.user_role });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
  };

  return (
    <div style={{ maxWidth: '480px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="section-num" style={{ marginBottom: '0.4rem' }}>
        00 / AUTHENTICATION & ACCESS
      </div>

      <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #D8D2CC', padding: '2.5rem', borderRadius: '0px' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: 600, color: '#191716', lineHeight: 1.15, marginBottom: '0.5rem' }}>
            {isRegister ? 'Register Clinical Researcher' : 'Clinical Portal Access'}
          </h2>
          <p style={{ color: '#625E5A', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
            Healthcare Machine Learning & MLOps Platform
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: '#F4DDDE', borderLeft: '4px solid #B4232D', color: '#64141A', padding: '0.75rem 1rem', fontSize: '0.825rem', marginBottom: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
            <strong>Authentication Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Full Name & Credentials
              </label>
              <div style={{ position: 'relative' }}>
                <UserIcon size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#625E5A' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ paddingLeft: '2.4rem', borderRadius: '0px', borderColor: '#D8D2CC' }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Institutional Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#625E5A' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.4rem', borderRadius: '0px', borderColor: '#D8D2CC' }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
              Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#625E5A' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.4rem', borderRadius: '0px', borderColor: '#D8D2CC' }}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.725rem', color: '#191716', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>
                Platform Authorization Role
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)} style={{ borderRadius: '0px', borderColor: '#D8D2CC' }}>
                <option value="ADMIN">ADMIN (Full model validation & registry controls)</option>
                <option value="USER">USER (Inference, Dataset inspection, NLP)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '0.75rem', borderRadius: '0px', padding: '0.75rem' }} 
            disabled={loading}
          >
            <LogIn size={15} />
            <span>{loading ? 'Authenticating Credentials...' : isRegister ? 'Register & Enter Platform' : 'Sign In to Portal'}</span>
          </button>
        </form>

        {/* Quick Demo Presets */}
        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid #D8D2CC' }}>
          <p style={{ fontSize: '0.675rem', color: '#625E5A', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            Institutional Demo Credentials
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              onClick={() => handlePreset('admin@healthlens.ai', 'AdminSecret123!')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem', borderRadius: '0px' }}
            >
              <CheckCircle2 size={13} color="#B4232D" />
              <span>Admin MLE</span>
            </button>
            <button
              onClick={() => handlePreset('demo@healthlens.ai', 'DemoUser123!')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.5rem', borderRadius: '0px' }}
            >
              <CheckCircle2 size={13} color="#B4232D" />
              <span>Demo User</span>
            </button>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button
            onClick={() => setIsRegister(!isRegister)}
            style={{ background: 'none', border: 'none', color: '#B4232D', fontSize: '0.825rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
          >
            {isRegister ? 'Already registered? Sign In to Portal' : 'Need an account? Register Clinical User'}
          </button>
        </div>
      </div>
    </div>
  );
};

