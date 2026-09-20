import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('patilabhay717@gmail.com');
  const [password, setPassword] = useState('Abhay@1234');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Destination after login
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('patilabhay717@gmail.com');
    setPassword('Abhay@1234');
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0f1d',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.25), transparent)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient light effects */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '10%',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '380px',
        height: '380px',
        borderRadius: '50%',
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        filter: 'blur(90px)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '460px', position: 'relative', zIndex: 10 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            marginBottom: '16px'
          }}>
            <ShieldCheck size={32} color="#ffffff" />
          </div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 6px 0',
            letterSpacing: '-0.02em'
          }}>
            Apex ERP System
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            margin: 0
          }}>
            Customer, Installment & Financial Management Portal
          </p>
        </div>

        {/* Login Card */}
        <div style={{
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '18px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          padding: '32px'
        }}>
          {/* Quick Demo Pill Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            border: '1px solid rgba(37, 99, 235, 0.3)',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} style={{ color: '#60a5fa' }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#93c5fd' }}>Admin Account</div>
                <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>patilabhay717@gmail.com</div>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#2563eb',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Fill Demo
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#fca5a5',
              fontSize: '0.84rem',
              marginBottom: '20px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#cbd5e1',
                marginBottom: '8px'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patilabhay717@gmail.com"
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#334155';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <label style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#cbd5e1'
                }}>
                  Password
                </label>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Default: <code style={{ color: '#93c5fd' }}>Abhay@1234</code>
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 42px',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #334155',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#334155';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '26px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.82rem',
                color: '#94a3b8',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                />
                Stay signed in for 7 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px 20px',
                backgroundColor: '#2563eb',
                backgroundImage: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                transition: 'transform 0.1s, box-shadow 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Apex ERP</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={14} style={{ color: '#10b981' }} />
            256-Bit Encrypted Session
          </span>
          <span>•</span>
          <span>Enterprise Role Guard</span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
